#!/usr/bin/env python3
"""Zone router: tells Claude where to look so it does not explore.

  build          (SessionStart)     indexes zones: manifest pages, site sections, learned zones
                                    (core/_ai/context/dss-zones.json, .claude/context/site-zones.json)
  route          (UserPromptSubmit) prompt anchors -> one zone; silent when unsure
  test "prompt"                     prints the routing (manual check)

French and other prompts reach English code through dss-alias.json.
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import dss_common as common  # noqa: E402

CACHE = "dss-index.cache.json"
PAGE = re.compile(r"\{\s*route:\s*'([^']+)',\s*name:\s*'([^']+)'(?:,\s*sections:\s*\[([^\]]*)\])?", re.S)
CATALOG_LINE = re.compile(r"@catalog\s+([^\n]+)")


def norm(text: str) -> str:
    text = unicodedata.normalize("NFKD", text.lower())
    return "".join(c for c in text if not unicodedata.combining(c))


def tokens(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", norm(text))


def load_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default


def page_file(route: str) -> str:
    return "app/page.tsx" if route == "/" else f"app{route}/page.tsx"


def nav_labels(root: Path) -> dict[str, str]:
    site = root / "content" / "site.ts"
    text = site.read_text(encoding="utf-8") if site.exists() else ""
    match = re.search(r"nav:\s*\{([^}]*)\}", text)
    return dict(re.findall(r"'([^']+)':\s*'([^']*)'", match.group(1))) if match else {}


def page_zones(root: Path) -> list[dict]:
    manifest = root / "site.manifest.ts"
    text = manifest.read_text(encoding="utf-8") if manifest.exists() else ""
    labels = nav_labels(root)
    zones = []
    for route, name, sections in PAGE.findall(text):
        ids = re.findall(r"'([^']+)'", sections or "")
        words = {name, *name.split("-"), *tokens(route), *tokens(labels.get(route, ""))}
        if route == "/":
            words |= {"home", "homepage", "landing"}
        zones.append({
            "name": f"page {route}",
            "keywords": sorted(w for w in words if w),
            "paths": [page_file(route), f"content/{name}.ts"],
            "files": [f"components/sections/{i.split('/')[0]}.tsx" for i in ids][:6],
        })
    return zones


def section_zones(root: Path) -> list[dict]:
    folder = root / "components" / "sections"
    zones = []
    for file in sorted(folder.glob("*.tsx")) if folder.is_dir() else []:
        text = file.read_text(encoding="utf-8")
        summary = CATALOG_LINE.search(text)
        zones.append({
            "name": f"section {file.stem}",
            "keywords": sorted({file.stem, *file.stem.split("-")}),
            "paths": [f"components/sections/{file.name}"],
            "notes": summary.group(1).strip()[:140] if summary else "",
        })
    return zones


def build(root: Path) -> dict:
    core = common.core_dir(root)
    context = core / "_ai" / "context"
    learned = load_json(context / "dss-zones.json", {"zones": []})["zones"]
    site_zones = load_json(root / ".claude" / "context" / "site-zones.json", {"zones": []})["zones"]
    index = {"zones": page_zones(root) + section_zones(root) + site_zones + learned, "aliases": load_json(context / "dss-alias.json", {})}
    target = root / ".claude" / "context" / CACHE
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")
    return index


def route(prompt: str, index: dict) -> list[str]:
    words = set(tokens(prompt))
    for word in list(words):
        words.update(norm(a) for a in index.get("aliases", {}).get(word, []))
    text = " ".join(tokens(prompt))
    scored = []
    for zone in index["zones"]:
        score = 0
        for keyword in zone.get("keywords", []):
            kw = norm(keyword)
            if " " in kw:
                score += 2 if kw in text else 0
            elif kw in words:
                score += 2
        score += sum(5 for p in zone.get("paths", []) if p.rstrip("/") in prompt)
        if score:
            scored.append((score, zone))
    scored.sort(key=lambda item: -item[0])
    if not scored or scored[0][0] < 2 or (len(scored) > 1 and scored[1][0] == scored[0][0]):
        return []
    zone = scored[0][1]
    lines = [f"dss-context: likely zone '{zone['name']}'"]
    lines += [f"- {path}" for path in zone.get("paths", [])[:4]]
    if zone.get("files"):
        lines.append(f"- files: {', '.join(zone['files'])}")
    if zone.get("notes"):
        lines.append(f"- note: {zone['notes']}")
    return lines[:6]


def load_index(root: Path) -> dict:
    cached = load_json(root / ".claude" / "context" / CACHE, None)
    return cached if cached else build(root)


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else "route"
    root = common.project_dir()
    try:
        common.core_dir(root)
    except FileNotFoundError:
        return 0
    if common.is_core_repo(root):
        return 0
    if mode == "build":
        build(root)
        return 0
    if mode == "test":
        lines = route(" ".join(sys.argv[2:]), build(root))
        print("\n".join(lines) if lines else "(silent: zone unclear)")
        return 0
    prompt = common.read_hook_input().get("prompt", "")
    if prompt.strip().startswith("/") and not prompt.strip().startswith(("/dss-page", "/dss-edit", "/dss-fix")):
        return 0
    lines = route(prompt, load_index(root))
    if lines:
        print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
