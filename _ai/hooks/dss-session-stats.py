#!/usr/bin/env python3
"""Stop: session tokens and duration in .claude/stats.jsonl (one line per session, updated).

Raw per-session record; the dollar report per step and model is `dss cost` (site.cost.md).
Warning (shown to the user, outside Claude's context) when the context re-read on every answer passes
150k tokens, then every 60k more (idea from ECC strategic-compact).
Threshold in thousands of tokens: DSS_CONTEXT_WARN (0 disables it).
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import dss_common as common  # noqa: E402

WARN_FIRST_K = 150
WARN_STEP = 60_000


def parse_time(value: str | None) -> datetime | None:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")) if value else None
    except ValueError:
        return None


def summarize(transcript: Path) -> dict:
    totals = {"input_tokens": 0, "output_tokens": 0, "cache_read_input_tokens": 0, "cache_creation_input_tokens": 0}
    first = last = None
    turns = 0
    skill = None
    context = 0
    seen: set[str] = set()
    for raw in transcript.read_text(encoding="utf-8").splitlines():
        try:
            entry = json.loads(raw)
        except json.JSONDecodeError:
            continue
        stamp = parse_time(entry.get("timestamp"))
        if stamp:
            first = first or stamp
            last = stamp
        message = entry.get("message") or {}
        if entry.get("type") == "user" and isinstance(message.get("content"), str):
            turns += 1
            text = message["content"].strip()
            if skill is None and "<command-name>/dss-" in text:
                skill = text.split("<command-name>/", 1)[1].split("<", 1)[0]
        usage = message.get("usage")
        message_id = message.get("id")
        if entry.get("type") == "assistant" and usage and message_id not in seen:
            seen.add(message_id)
            for key in totals:
                totals[key] += int(usage.get(key) or 0)
            if not entry.get("isSidechain"):
                # context size of the main thread's last answer
                context = sum(int(usage.get(k) or 0) for k in ("input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens"))
    duration = int((last - first).total_seconds()) if first and last else 0
    return {**totals, "turns": turns, "duration_s": duration, "skill": skill, "context": context, "started": first.isoformat() if first else None}


def warn_threshold() -> int:
    try:
        return int(os.environ.get("DSS_CONTEXT_WARN", WARN_FIRST_K)) * 1000
    except ValueError:
        return WARN_FIRST_K * 1000


def context_warning(context: int, warned: int, first: int, step: int = WARN_STEP) -> tuple[str | None, int]:
    """Message when the context crosses a new level; resets below the first threshold (after /compact)."""
    if first <= 0 or context < first:
        return None, 0
    level = first + (context - first) // step * step
    if level <= warned:
        return None, warned
    message = (
        f"dss: context at {round(context / 1000)}k tokens, re-read on every answer. "
        "Between topics: /clear (site.spec.md and the code keep the state); otherwise /compact."
    )
    return message, level


def main() -> int:
    data = common.read_hook_input()
    transcript = Path(data.get("transcript_path") or "")
    session = data.get("session_id")
    if not session or not transcript.is_file():
        return 0
    stats_file = common.project_dir() / ".claude" / "stats.jsonl"
    entries = []
    if stats_file.exists():
        entries = [json.loads(l) for l in stats_file.read_text(encoding="utf-8").splitlines() if l.strip()]
    previous = next((e for e in entries if e.get("session_id") == session), {})
    record = {"session_id": session, **summarize(transcript)}
    message, record["warned"] = context_warning(record["context"], int(previous.get("warned") or 0), warn_threshold())
    entries = [e for e in entries if e.get("session_id") != session] + [record]
    stats_file.parent.mkdir(parents=True, exist_ok=True)
    stats_file.write_text("".join(json.dumps(e, ensure_ascii=False) + "\n" for e in entries[-500:]), encoding="utf-8")
    if message:
        print(json.dumps({"systemMessage": message}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
