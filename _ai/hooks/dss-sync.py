#!/usr/bin/env python3
"""SessionStart: syncs core/_ai into the site's .claude/.

- copies rules, on-demand rules, skills (vendor skills flattened), agents, hooks, context (dss-* entries only)
- removes dss-* entries that left the core, never touches site-* entries
- merges core/_ai/settings.json into .claude/settings.json (dss hooks replaced, permission lists unioned)
- never writes AGENTS.md (owned by `next dev`) nor CLAUDE.md (owned by the site)
Silent when nothing changed: SessionStart output enters Claude's context.

Options: --force (copy everything again).
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import dss_common as common  # noqa: E402

FOLDERS = ("rules", "rules-ondemand", "agents", "hooks", "context", "skills")
STAMP = ".dss-sync"
IGNORED = ("__pycache__", "tests")


def vendor_names(src: Path) -> set[str]:
    vendor = src / "vendor"
    return {p.name for p in vendor.iterdir() if p.is_dir()} if vendor.is_dir() else set()


def copy_entry(src: Path, dst: Path) -> int:
    if src.is_dir():
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(src, dst, ignore=shutil.ignore_patterns(*IGNORED))
        return 1
    if dst.exists() and dst.read_bytes() == src.read_bytes():
        return 0
    shutil.copy2(src, dst)
    return 1


def sync_folder(src: Path, dst: Path) -> int:
    """Copies dss* entries (files or folders) and removes the ones that disappeared."""
    if not src.is_dir():
        return 0
    dst.mkdir(parents=True, exist_ok=True)
    changed = 0
    wanted: set[str] = set()
    vendored = vendor_names(src)
    for entry in src.iterdir():
        if entry.name in IGNORED:
            continue
        if entry.name == "vendor" and entry.is_dir():
            for skill in entry.iterdir():
                if skill.is_dir():
                    wanted.add(skill.name)
                    changed += copy_entry(skill, dst / skill.name)
            continue
        if not entry.name.startswith("dss"):
            continue
        wanted.add(entry.name)
        changed += copy_entry(entry, dst / entry.name)
    for existing in dst.iterdir():
        managed = existing.name.startswith("dss") or existing.name in vendored
        if managed and existing.name not in wanted:
            shutil.rmtree(existing) if existing.is_dir() else existing.unlink()
            changed += 1
    return changed


def merge_settings(core_settings: Path, site_settings: Path) -> bool:
    if not core_settings.exists():
        return False
    core = json.loads(core_settings.read_text(encoding="utf-8"))
    site = json.loads(site_settings.read_text(encoding="utf-8")) if site_settings.exists() else {}
    merged = dict(site)
    hooks = {event: [h for h in entries if "dss-" not in json.dumps(h)] for event, entries in site.get("hooks", {}).items()}
    for event, entries in core.get("hooks", {}).items():
        hooks[event] = entries + hooks.get(event, [])
    merged["hooks"] = {k: v for k, v in hooks.items() if v}
    permissions = dict(site.get("permissions", {}))
    for key, values in core.get("permissions", {}).items():
        if isinstance(values, list):
            permissions[key] = sorted(set(permissions.get(key, [])) | set(values))
        else:
            permissions.setdefault(key, values)
    merged["permissions"] = permissions
    for key, value in core.items():
        if key in ("hooks", "permissions"):
            continue
        if isinstance(value, dict) and isinstance(site.get(key), dict):
            merged[key] = {**value, **site[key]}  # new core entries arrive, the site's choices win
        else:
            merged.setdefault(key, value)
    return common.write_if_changed(site_settings, json.dumps(merged, indent=2, ensure_ascii=False) + "\n")


def fingerprint(core: Path) -> str:
    ai = core / "_ai"
    version = (core / "VERSION").read_text(encoding="utf-8").strip() if (core / "VERSION").exists() else "0"
    files = [p for p in ai.rglob("*") if p.is_file() and "__pycache__" not in p.parts]
    return f"{version}:{len(files)}:{common.newest_mtime(files):.0f}"


def main() -> int:
    force = "--force" in sys.argv
    project = common.project_dir()
    try:
        core = common.core_dir(project)
    except FileNotFoundError:
        return 0
    if common.is_core_repo(project):
        return 0
    claude = project / ".claude"
    stamp = claude / STAMP
    current = fingerprint(core)
    if not force and stamp.exists() and stamp.read_text(encoding="utf-8") == current:
        return 0
    changed = sum(sync_folder(core / "_ai" / folder, claude / folder) for folder in FOLDERS)
    changed += int(merge_settings(core / "_ai" / "settings.json", claude / "settings.json"))
    stamp.parent.mkdir(parents=True, exist_ok=True)
    stamp.write_text(current, encoding="utf-8")
    if changed and not force:
        print(f"dss: AI layer synced ({changed} item(s) updated from core/_ai).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
