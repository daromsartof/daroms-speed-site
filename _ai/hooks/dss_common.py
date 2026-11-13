"""Shared helpers for dss hooks (standard library only). Ported from daroms-speed-app.

- locate the project and the core (site with core/ attached, or the core repository itself)
- read hook input, write files only when they change
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path


def project_dir() -> Path:
    env = os.environ.get("CLAUDE_PROJECT_DIR")
    return Path(env).resolve() if env else Path.cwd().resolve()


def core_dir(project: Path | None = None) -> Path:
    """The core: `core/` in a site, the root in the core repository."""
    root = project or project_dir()
    if (root / "core" / "_ai").is_dir():
        return root / "core"
    if (root / "_ai").is_dir() and (root / "packages" / "design").is_dir():
        return root
    raise FileNotFoundError(f"dss core not found from {root}")


def is_core_repo(project: Path | None = None) -> bool:
    root = project or project_dir()
    return core_dir(root) == root


def read_hook_input() -> dict:
    try:
        raw = sys.stdin.read()
        return json.loads(raw) if raw.strip() else {}
    except (json.JSONDecodeError, OSError):
        return {}


def write_if_changed(path: Path, content: str) -> bool:
    if path.exists() and path.read_text(encoding="utf-8") == content:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return True


def newest_mtime(paths: list[Path]) -> float:
    return max((p.stat().st_mtime for p in paths if p.exists()), default=0.0)


def deny(event: str, reason: str) -> None:
    """Prints a PreToolUse deny decision."""
    payload = {"hookSpecificOutput": {"hookEventName": event, "permissionDecision": "deny", "permissionDecisionReason": reason}}
    print(json.dumps(payload, ensure_ascii=False))
