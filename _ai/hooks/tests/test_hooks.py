"""Unit tests for dss hooks: python3 -m unittest discover -s _ai/hooks/tests"""
from __future__ import annotations

import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path

HOOKS = Path(__file__).resolve().parent.parent


def load(name: str):
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), HOOKS / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


rules = load("dss-check-rules")
deny_env = load("dss-deny-env")
context = load("dss-context")
sync = load("dss-sync")
stats = load("dss-session-stats")


class CheckRulesTest(unittest.TestCase):
    def problems(self, rel: str, text: str) -> list[str]:
        return rules.check(rel, text)

    def test_raw_colors_and_default_palette(self):
        self.assertTrue(self.problems("components/sections/a.tsx", "const c = '#ff0000'"))
        self.assertTrue(self.problems("components/sections/a.tsx", '<div className="bg-indigo-600 text-white" />'))
        self.assertTrue(self.problems("components/sections/a.tsx", '<div className="bg-[#123456]" />'))
        self.assertFalse(self.problems("components/sections/a.tsx", '<div className="bg-accent text-accent-ink" />'))

    def test_next16_and_security(self):
        self.assertTrue(self.problems("app/actions.ts", "revalidateTag('posts')"))
        self.assertFalse(self.problems("app/actions.ts", "revalidateTag('posts', 'max')"))
        self.assertTrue(self.problems("lib/env.ts", "process.env.NEXT_PUBLIC_STRIPE_SECRET"))
        self.assertTrue(self.problems("app/page.tsx", "'use client'"))
        self.assertTrue(self.problems("middleware.ts", "export function middleware() {}"))
        self.assertTrue(self.problems("components/x.tsx", '<div dangerouslySetInnerHTML={{ __html: x }} />'))

    def test_markup(self):
        self.assertTrue(self.problems("components/x.tsx", '<img src="/a.jpg" />'))
        self.assertTrue(self.problems("components/x.tsx", '<a href="/about">x</a>'))
        self.assertFalse(self.problems("components/x.tsx", '<a href="https://x.y">{label}</a>'))
        self.assertTrue(self.problems("components/x.tsx", "<div style={{ color: c }} />"))
        self.assertFalse(self.problems("components/x.tsx", "<div style={{ '--progress': p }} />"))

    def test_copy_in_jsx_and_three(self):
        self.assertTrue(self.problems("components/sections/x.tsx", "<p>Welcome to our studio</p>"))
        self.assertFalse(self.problems("components/sections/x.tsx", "<p>{copy.title}</p>"))
        self.assertTrue(self.problems("components/sections/x.tsx", "import { Mesh } from 'three'"))
        self.assertFalse(self.problems("components/3d/blob.tsx", "import { Mesh } from 'three'"))

    def test_slop_gate_in_content(self):
        found = self.problems("content/home.ts", "  title: 'Elevate your brand with seamless solutions',")
        self.assertTrue(any("cliche" in p for p in found))
        self.assertFalse(self.problems("content/home.ts", "  title: 'Forty tables a year, from one workshop in Lyon',"))
        self.assertTrue(self.problems("content/home.ts", "  title: 'Built to last — really',"))

    def test_escape_and_scope(self):
        self.assertFalse(self.problems("components/x.tsx", "const c = '#fff' // dss-ignore: favicon"))
        self.assertFalse(rules.applies("core/packages/ui/src/a.tsx"))
        self.assertFalse(rules.applies("app/theme.ts"))
        self.assertTrue(rules.applies("components/sections/hero.tsx"))

    def test_long_file_and_cap(self):
        long = "\n".join(f"const a{i} = 1" for i in range(260))
        self.assertTrue(any("lines" in p for p in self.problems("lib/x.ts", long)))
        many = "\n".join("const c = '#ff0000'" for _ in range(20))
        self.assertLessEqual(len(self.problems("lib/x.ts", many)), 8)

    def test_edit_reconstructs_full_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "x.ts"
            path.write_text("const a = 1\n", encoding="utf-8")
            text, full = rules.proposed("Edit", {"old_string": "const a = 1", "new_string": "const a: any = 1"}, path)
            self.assertIn("any", text)
            self.assertEqual(full, "const a: any = 1\n")


class DenyEnvTest(unittest.TestCase):
    def test_blocks_secrets(self):
        for command in ("cat .env", "cat .env.local", "less ./.dev.vars", "printenv", "wrangler secret list", "vercel env pull"):
            self.assertTrue(deny_env.is_blocked(command), command)

    def test_allows_examples(self):
        for command in ("cat .env.example", "pnpm build", "grep env README.md"):
            self.assertFalse(deny_env.is_blocked(command), command)


class ContextTest(unittest.TestCase):
    def make_site(self, tmp: str) -> Path:
        root = Path(tmp)
        (root / "core" / "_ai" / "context").mkdir(parents=True)
        (root / "core" / "packages" / "design").mkdir(parents=True)
        (root / "core" / "_ai" / "context" / "dss-alias.json").write_text(json.dumps({"tarifs": ["pricing"]}), encoding="utf-8")
        (root / "core" / "_ai" / "context" / "dss-zones.json").write_text(json.dumps({"zones": []}), encoding="utf-8")
        (root / "content").mkdir()
        (root / "content" / "site.ts").write_text("nav: { '/': 'Home', '/pricing': 'Plans' }", encoding="utf-8")
        (root / "components" / "sections").mkdir(parents=True)
        (root / "components" / "sections" / "faq.tsx").write_text("/** @catalog FAQ accordion */", encoding="utf-8")
        (root / "site.manifest.ts").write_text(
            "pages: [\n { route: '/', name: 'home', sections: ['hero', 'faq'] },\n { route: '/pricing', name: 'pricing', sections: ['pricing'] },\n]",
            encoding="utf-8",
        )
        return root

    def test_routes_pages_through_aliases(self):
        with tempfile.TemporaryDirectory() as tmp:
            index = context.build(self.make_site(tmp))
            lines = context.route("changer les tarifs", index)
            self.assertIn("page /pricing", lines[0])
            self.assertIn("- app/pricing/page.tsx", lines)

    def test_silent_when_unsure(self):
        with tempfile.TemporaryDirectory() as tmp:
            index = context.build(self.make_site(tmp))
            self.assertEqual(context.route("make it nicer", index), [])

    def test_sections_carry_their_catalog_line(self):
        with tempfile.TemporaryDirectory() as tmp:
            index = context.build(self.make_site(tmp))
            lines = context.route("update components/sections/faq.tsx", index)
            self.assertTrue(any("FAQ accordion" in l for l in lines))


class SyncTest(unittest.TestCase):
    def test_copies_dss_entries_and_flattens_vendor(self):
        with tempfile.TemporaryDirectory() as tmp:
            src, dst = Path(tmp) / "src", Path(tmp) / "dst"
            (src / "dss-a").mkdir(parents=True)
            (src / "dss-a" / "SKILL.md").write_text("a", encoding="utf-8")
            (src / "vendor" / "frontend-design").mkdir(parents=True)
            (src / "vendor" / "frontend-design" / "SKILL.md").write_text("f", encoding="utf-8")
            (dst / "site-own").mkdir(parents=True)
            (dst / "dss-gone").mkdir()
            sync.sync_folder(src, dst)
            self.assertTrue((dst / "dss-a" / "SKILL.md").exists())
            self.assertTrue((dst / "frontend-design" / "SKILL.md").exists())
            self.assertTrue((dst / "site-own").exists())
            self.assertFalse((dst / "dss-gone").exists())

    def test_merge_settings_keeps_site_choices(self):
        with tempfile.TemporaryDirectory() as tmp:
            core, site = Path(tmp) / "core.json", Path(tmp) / "site.json"
            core.write_text(json.dumps({
                "permissions": {"allow": ["A"], "deny": ["D"]},
                "hooks": {"Stop": [{"hooks": [{"command": "dss-session-stats.py"}]}]},
                "skillOverrides": {"x": "name-only", "y": "name-only"},
            }), encoding="utf-8")
            site.write_text(json.dumps({
                "permissions": {"allow": ["B"]},
                "hooks": {"Stop": [{"hooks": [{"command": "old dss-session-stats.py"}]}, {"hooks": [{"command": "mine"}]}]},
                "skillOverrides": {"x": "full"},
            }), encoding="utf-8")
            sync.merge_settings(core, site)
            merged = json.loads(site.read_text(encoding="utf-8"))
            self.assertEqual(merged["permissions"]["allow"], ["A", "B"])
            self.assertEqual([h["hooks"][0]["command"] for h in merged["hooks"]["Stop"]], ["dss-session-stats.py", "mine"])
            self.assertEqual(merged["skillOverrides"], {"x": "full", "y": "name-only"})


class StatsTest(unittest.TestCase):
    def test_context_warning_levels(self):
        message, level = stats.context_warning(160_000, 0, 150_000)
        self.assertIn("160k", message)
        self.assertEqual(stats.context_warning(170_000, level, 150_000), (None, level))
        self.assertEqual(stats.context_warning(100_000, level, 150_000), (None, 0))

    def test_summarize_counts_skill_and_tokens(self):
        with tempfile.TemporaryDirectory() as tmp:
            transcript = Path(tmp) / "t.jsonl"
            transcript.write_text("\n".join(json.dumps(e) for e in [
                {"type": "user", "timestamp": "2026-11-13T10:00:00Z", "message": {"content": "<command-name>/dss-page</command-name>"}},
                {"type": "assistant", "timestamp": "2026-11-13T10:01:00Z", "message": {"id": "m1", "usage": {"input_tokens": 10, "output_tokens": 5}}},
                {"type": "assistant", "timestamp": "2026-11-13T10:01:00Z", "message": {"id": "m1", "usage": {"input_tokens": 10, "output_tokens": 5}}},
            ]), encoding="utf-8")
            summary = stats.summarize(transcript)
            self.assertEqual(summary["skill"], "dss-page")
            self.assertEqual(summary["output_tokens"], 5)
            self.assertEqual(summary["duration_s"], 60)


if __name__ == "__main__":
    os.environ.pop("CLAUDE_PROJECT_DIR", None)
    unittest.main()
