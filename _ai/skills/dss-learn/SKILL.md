---
name: dss-learn
description: End of a task or site - improves routing zones so the next request finds the files faster, and records reusable lessons in the factory brain.
argument-hint: "<the request that was just completed>"
context: fork
background: false
model: haiku
---

# /dss-learn: remember what helps

Task: $ARGUMENTS

1. Files of the task: `git status --short` and `git log -5 --name-only --format='%h %s'`.
2. Router: `python3 .claude/hooks/dss-context.py test "<request>"`. Wrong or silent: add a zone to `.claude/context/site-zones.json`
   (`{ "zones": [{ "name", "keywords" (3-8 lowercase words, English and the user's language), "paths", "notes" }] }`). Retest.
3. Lessons true for other sites (a section idea, a copy angle, a fix, an industry insight): append one dated line to
   `site.spec.md > Journal` and, if `~/.dss/brain/` exists, run the brain ingest skill when available.
4. Framework-wide routing knowledge: suggest it for `core/_ai/context/dss-zones.json` (core repository), never edit `core/` here.
5. **Stop**: zone or lesson added, one line.
