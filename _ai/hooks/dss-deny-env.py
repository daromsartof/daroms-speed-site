#!/usr/bin/env python3
"""PreToolUse (Bash): refuses commands that read, print or copy secret files.

Covers .env*, .dev.vars (Wrangler local secrets) and env dumps. `.env.example` stays allowed.
The deny list in settings.json covers Read/Edit/Write; this hook covers the shell.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import dss_common as common  # noqa: E402

ENV_FILE = re.compile(r"(?:^|[\s/'\"=<>|;&(])\.(?:env(?:\.(?!example\b)[\w.-]+)?|dev\.vars)(?=$|[\s'\";|&)<>])")
ENV_DUMP = re.compile(r"(?:^|[;&|]\s*)(?:printenv|env)\s*(?:$|[;&|])")
SECRET_READ = re.compile(r"\bwrangler\s+secret\s+(?:list|get)\b|\bvercel\s+env\s+pull\b")


def is_blocked(command: str) -> bool:
    return bool(ENV_FILE.search(command) or ENV_DUMP.search(command) or SECRET_READ.search(command))


def main() -> int:
    command = (common.read_hook_input().get("tool_input") or {}).get("command", "")
    if command and is_blocked(command):
        common.deny(
            "PreToolUse",
            "dss-deny-env: secret files (.env, .dev.vars) and secret stores are never read. "
            "Use .env.example for the variable list; ask the user to set values.",
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
