#!/usr/bin/env python3
"""PreToolUse (Edit|Write|MultiEdit): refuses a write that breaks dss rules, before it lands.

Checks the proposed text (new content) of site files: raw colors and default Tailwind palette
classes (generated-site tells), `any`, inline styles, <img>, internal <a>, client pages, Next 16
API changes, secrets exposed to the client, unsanitised HTML, three.js outside components/3d,
banned motion libraries, hard-coded JSX copy, AI-cliche copy (slop gate), long files.
At most 8 short messages. `--all` (dss doctor) scans the site and exits 1 on violations.
Escape hatch for a reasoned exception: a `dss-ignore` comment on the line.

The slop gate is inspired by COG second brain's slop-gate (MIT, github.com/huytieu/COG-second-brain).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import dss_common as common  # noqa: E402

MAX_LINES = 250
TS = (".ts", ".tsx")
TSX = (".tsx",)
PALETTE = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose"
UTILS = "bg|text|border|from|via|to|ring|fill|stroke|outline|decoration|divide|shadow|accent|caret|placeholder"
EMOJI = re.compile("[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF]")

# Type rule, matched on code only: copy such as "Fake sites: any payment" is not a type annotation.
ANY = re.compile(r"(?::\s*any\b|\bas\s+any\b|<any>|\bany\[\])")
CODE_ONLY = (ANY,)

# (pattern, message, suffixes, path prefixes or None for every checked file)
LINE_RULES: list[tuple[re.Pattern[str], str, tuple[str, ...], tuple[str, ...] | None]] = [
    (re.compile(r"""['"`]#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})['"`]"""),
     "raw hex color: use DNA token classes (bg-surface, text-ink, bg-accent, text-accent-text...)", TS, None),
    (re.compile(r"""['"`(]\s*(?:rgb|rgba|hsl|hsla|oklch)\("""), "raw color function: use a DNA token class", TS, None),
    (re.compile(rf"\b(?:{UTILS})-\[(?:#|rgb|hsl|oklch|color)"), "arbitrary color value: use a DNA token class", TS, None),
    (re.compile(rf"\b(?:{UTILS})-(?:{PALETTE})-(?:50|[1-9]00|950)\b"),
     "default Tailwind palette color (a generated-site tell): use DNA tokens (CATALOG.md > Tokens)", TS, None),
    (ANY, "`any`: type precisely (unknown + zod when parsing)", TS, None),
    (re.compile(r"\bstyle=\{\{(?!\s*['\"]--)"), "inline style: Tailwind token classes (CSS variables only: style={{ '--x': v }})", TSX, None),
    (re.compile(r"<img\b"), "<img>: use Media from @dss/ui (next/image: sizes, AVIF, lazy loading)", TSX, None),
    (re.compile(r"<a\s[^>]*href=[\"'{`]+/(?!/)"), "internal <a href>: use next/link (or ButtonLink)", TSX, None),
    (re.compile(r"from\s+['\"]framer-motion['\"]"), "framer-motion: import from 'motion/react' or use @dss/motion", TS, None),
    (re.compile(r"from\s+['\"]gsap"), "GSAP is excluded (license): use @dss/motion (Motion + CSS scroll timelines)", TS, None),
    (re.compile(r"\brevalidateTag\(\s*[^,()]+\)"), "revalidateTag needs a profile in Next 16: revalidateTag(tag, 'max')", TS, None),
    (re.compile(r"export\s+const\s+runtime\s*=\s*['\"]edge['\"]"), "runtime 'edge' is not used: Node runtime (OpenNext on Workers)", TS, None),
    (re.compile(r"\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{"), "params is a Promise in Next 16: use PageProps<'/route'> and await params", TS, None),
    (re.compile(r"NEXT_PUBLIC_\w*(?:SECRET|PRIVATE|PASSWORD|API_KEY|TOKEN)\b"), "secret exposed to the browser: drop NEXT_PUBLIC_ and read it server-side", TS, None),
    (re.compile(r"dangerouslySetInnerHTML"), "dangerouslySetInnerHTML: only <JsonLd> from @dss/seo/react may inject HTML", TSX, None),
    (re.compile(r"from\s+['\"](?:three|@react-three/[\w-]+)['\"/]"), "three.js only in components/3d/** (lazy, client-only, via <Scene>)", TS,
     ("app/", "components/sections/", "components/site/", "content/", "lib/", "server/")),
    (re.compile(r"\bprocess\.env\."), "process.env in UI code: read env server-side (server/, defineEnv)", TS, ("components/", "content/")),
    (re.compile(r"['\"]use client['\"]"), "client page/layout: keep app/** server components; put interactivity in a component", TSX, ("app/",)),
    (re.compile(r">\s*[A-Za-zÀ-ÿ][^<>{}\n]*[A-Za-zÀ-ÿ.!?:]\s*</[A-Za-z]"),
     "hard-coded copy in JSX: put the text in content/<page>.ts and pass it as props", TSX, ("app/", "components/sections/", "components/site/")),
    (re.compile("—"), "em dash: rewrite the sentence (a frequent generated-copy tell)", TS, ("content/", "app/", "components/")),
]

# Generated-copy cliches. Matched case-insensitively inside string literals of content files.
SLOP = [
    r"unlock(?:ing)? (?:the|your)", r"unleash", r"\belevat(?:e|es|ing) (?:your|the)", r"seamless(?:ly)?", r"\bdelv(?:e|ing)\b",
    r"in today'?s (?:fast-paced|digital|ever)", r"cutting[- ]edge", r"game[- ]chang", r"revolutioni[sz]",
    r"\bempower(?:s|ing)?\b", r"supercharg", r"next[- ]level", r"world[- ]class", r"best[- ]in[- ]class",
    r"state[- ]of[- ]the[- ]art", r"harness(?:ing)? the power", r"look no further", r"embark on", r"\btapestry\b",
    r"testament to", r"ever[- ]evolving", r"\bsynerg", r"transformative", r"dive (?:deep )?into", r"we'?ve got you covered",
    r"stand out from the crowd", r"one[- ]stop[- ]shop", r"innovative solutions", r"tailored solutions",
    r"in the realm of", r"(?:it'?s|is) not just (?:a|an|about)", r"more than just a", r"crafted with (?:love|passion|care)",
    r"passionate about", r"your journey", r"take (?:it|your \w+) to the next", r"boostez", r"propulsez", r"sublimez",
    r"solutions? innovantes?", r"n'attendez plus", r"à la pointe de", r"bien plus qu'un",
]
SLOP_RE = re.compile("|".join(SLOP), re.I)
STRING = re.compile(r"""(['"`])((?:\\.|(?!\1).)*)\1""")
SKIP = ("app/theme.ts", "app/fonts.ts", "content/meta.ts", "next-env.d.ts", "cloudflare-env.d.ts")
CHECKED = ("app/", "components/", "content/", "lib/", "server/")


def relative(path: Path, root: Path) -> str:
    try:
        return path.resolve().relative_to(root).as_posix()
    except ValueError:
        return path.as_posix()


def applies(rel: str) -> bool:
    if rel in SKIP or ".test." in rel or rel.endswith(".d.ts"):
        return False
    return rel.startswith(CHECKED) or rel in ("middleware.ts", "src/middleware.ts")


def slop_hits(line: str) -> list[str]:
    hits: list[str] = []
    for match in STRING.finditer(line):
        hits += [m.group(0) for m in SLOP_RE.finditer(match.group(2))]
    return hits


def check(rel: str, text: str, full: str | None = None) -> list[str]:
    """Violations (at most 8) for the proposed text; `full` = the whole resulting file."""
    if rel in ("middleware.ts", "src/middleware.ts"):
        return ["middleware.ts is proxy.ts in Next 16 (export function proxy); prefer withDss headers when possible"]
    suffix = Path(rel).suffix
    problems: list[str] = []
    for number, line in enumerate(text.splitlines(), 1):
        stripped = line.strip()
        if stripped.startswith(("//", "*", "/*")) or "dss-ignore" in line:
            continue
        code = STRING.sub(lambda m: m.group(1) * 2, line)
        for pattern, message, suffixes, prefixes in LINE_RULES:
            target = code if pattern in CODE_ONLY else line
            if suffix in suffixes and (prefixes is None or rel.startswith(prefixes)) and pattern.search(target):
                problems.append(f"line {number}: {message}")
        if EMOJI.search(line) and rel.startswith(("content/", "app/", "components/")):
            problems.append(f"line {number}: emoji in site copy or UI: remove it")
        if rel.startswith("content/") and suffix in TS:
            hits = slop_hits(line)
            if hits:
                problems.append(f"line {number}: generated-copy cliche ({', '.join(sorted(set(h.lower() for h in hits)))}): write the specific fact instead")
    content = full if full is not None else text
    if suffix in TS and len(content.splitlines()) > MAX_LINES:
        problems.append(f"file has {len(content.splitlines())} lines (> {MAX_LINES}): split it")
    return list(dict.fromkeys(problems))[:8]


def proposed(tool: str, tool_input: dict, path: Path) -> tuple[str, str | None]:
    """Text to check and the whole resulting content (when computable)."""
    if tool == "Write":
        content = tool_input.get("content", "")
        return content, content
    current = path.read_text(encoding="utf-8") if path.exists() else ""
    edits = tool_input.get("edits") or [tool_input]
    parts, full = [], current
    for edit in edits:
        old, new = edit.get("old_string", ""), edit.get("new_string", "")
        parts.append(new)
        full = full.replace(old, new) if edit.get("replace_all") else full.replace(old, new, 1)
    return "\n".join(parts), full


def run_hook() -> int:
    data = common.read_hook_input()
    tool_input = data.get("tool_input") or {}
    file_path = tool_input.get("file_path")
    if not file_path:
        return 0
    root = Path(data.get("cwd") or common.project_dir()).resolve()
    path = Path(file_path)
    rel = relative(path, root)
    if not applies(rel):
        return 0
    text, full = proposed(data.get("tool_name", ""), tool_input, path)
    problems = check(rel, text, full)
    if problems:
        reason = f"dss-check-rules refused {rel}:\n- " + "\n- ".join(problems) + "\nFix and write again (tokens and components: core/CATALOG.md)."
        common.deny("PreToolUse", reason)
    return 0


def run_all() -> int:
    root = common.project_dir()
    count = 0
    for folder in CHECKED:
        base = root / folder
        for path in sorted(base.rglob("*")) if base.is_dir() else []:
            if path.suffix not in TS or "node_modules" in path.parts:
                continue
            rel = relative(path, root)
            if not applies(rel):
                continue
            for problem in check(rel, path.read_text(encoding="utf-8")):
                print(f"{rel}: {problem}")
                count += 1
    return 1 if count else 0


if __name__ == "__main__":
    sys.exit(run_all() if "--all" in sys.argv else run_hook())
