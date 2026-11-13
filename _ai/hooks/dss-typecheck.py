#!/usr/bin/env python3
"""PostToolUse (Edit|Write|MultiEdit): incremental tsc + eslint, reported for the touched file only.

Output capped at 20 lines; `decision: block` sends the errors back to Claude to fix.
Route types (`next typegen`) are generated once if missing, so typed routes resolve.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import dss_common as common  # noqa: E402

MAX_LINES = 20


def run(cmd: list[str], cwd: Path, timeout: int = 90) -> str:
    try:
        proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)
        return (proc.stdout or "") + (proc.stderr or "")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return ""


def main() -> int:
    data = common.read_hook_input()
    file_path = (data.get("tool_input") or {}).get("file_path", "")
    root = Path(data.get("cwd") or common.project_dir()).resolve()
    path = Path(file_path)
    if path.suffix not in (".ts", ".tsx") or not (root / "tsconfig.json").exists():
        return 0
    try:
        rel = path.resolve().relative_to(root).as_posix()
    except ValueError:
        return 0
    if rel.startswith(("core/", "node_modules/", ".next/")):
        return 0
    if not (root / ".next" / "types").exists():
        run(["pnpm", "exec", "next", "typegen"], root, timeout=60)
    (root / ".dss").mkdir(exist_ok=True)
    tsc = run(["pnpm", "exec", "tsc", "--noEmit", "--incremental", "--tsBuildInfoFile", ".dss/tsbuildinfo", "--pretty", "false"], root)
    errors = [line for line in tsc.splitlines() if line.startswith(rel) and "error TS" in line]
    lint = run(["pnpm", "exec", "eslint", "--format", "unix", rel], root, timeout=60)
    errors += [line.replace(str(root) + "/", "") for line in lint.splitlines() if ":" in line and "[Error" in line]
    if not errors:
        return 0
    more = f"\n(+{len(errors) - MAX_LINES} more)" if len(errors) > MAX_LINES else ""
    reason = f"dss-typecheck: {len(errors)} problem(s) in {rel}\n" + "\n".join(errors[:MAX_LINES]) + more
    print(json.dumps({"decision": "block", "reason": reason}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
