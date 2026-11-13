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
import os
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
            "kind": "page",
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
            "kind": "section",
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


def score_zone(zone: dict, words: set[str], text: str, prompt: str) -> int:
    weight = 1 if zone.get("kind") == "section" else 2  # a section name alone is weak evidence
    score = 0
    for keyword in zone.get("keywords", []):
        kw = norm(keyword)
        if " " in kw:
            score += weight if kw in text else 0
        elif kw in words:
            score += weight
    return score + sum(5 for p in zone.get("paths", []) if p.rstrip("/") in prompt)


def route(prompt: str, index: dict) -> list[str]:
    words = set(tokens(prompt))
    for word in list(words):
        words.update(norm(a) for a in index.get("aliases", {}).get(word, []))
    text = " ".join(tokens(prompt))
    scored = [(s, z) for z in index["zones"] if (s := score_zone(z, words, text, prompt))]
    scored.sort(key=lambda item: -item[0])
    # A page or section of this site beats a generic zone: it names the exact files.
    specific = [item for item in scored if item[1].get("kind") in ("page", "section")]
    pool = specific if specific and specific[0][0] >= 2 else scored
    if not pool or pool[0][0] < 2 or (len(pool) > 1 and pool[1][0] == pool[0][0]):
        return []
    zone = pool[0][1]
    lines = [f"dss-context: likely zone '{zone['name']}'"]
    lines += [f"- {path}" for path in zone.get("paths", [])[:4]]
    if zone.get("files"):
        lines.append(f"- files: {', '.join(zone['files'])}")
    if zone.get("notes"):
        lines.append(f"- note: {zone['notes']}")
    return lines[:6]


def brain_dir() -> Path:
    env = os.environ.get("DSS_BRAIN")
    return Path(env) if env else Path.home() / ".dss" / "brain"


def overlap(query: set[str], line: set[str]) -> int:
    """Same word, or a shared stem of 5+ letters (architect ~ architecture)."""
    score = 0
    for q in query:
        for w in line:
            short, long = (q, w) if len(q) < len(w) else (w, q)
            if q == w or (len(short) >= 5 and long.startswith(short)):
                score += 1
                break
    return score


def brain_hint(prompt: str, brain: Path | None = None) -> str | None:
    """The best brain index line sharing at least two words with the prompt (index-first, no embeddings)."""
    index = (brain or brain_dir()) / "index.md"
    if not index.is_file():
        return None
    wanted = {w for w in tokens(prompt) if len(w) > 2}
    best, best_score = None, 1
    for line in index.read_text(encoding="utf-8").splitlines():
        if not line.startswith("- ["):
            continue
        score = overlap(wanted, {w for w in tokens(line) if len(w) > 2})
        if score > best_score:
            best, best_score = line, score
    if not best:
        return None
    match = re.match(r"- \[([^\]]+)\]\(([^)]+)\)", best)
    return f"- brain: {match.group(2)} ({match.group(1)}), /dss-brain-query for details" if match else None


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
    hint = brain_hint(prompt)
    if hint:
        lines = (lines[:5] if lines else ["dss-context:"]) + [hint]
    if lines:
        print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
