---
paths:
  - ".claude/**"
  - "CLAUDE.md"
---
# AI files

> dss-* files in .claude/ are overwritten by the sync from core/_ai; site-specific ones are prefixed site-.

- Site skills, rules, agents: `.claude/skills/site-*`, `.claude/rules/site-*.md`. Learned routing zones: `.claude/context/site-zones.json`.
- CLAUDE.md keeps the three imports (AGENTS.md, kernel, digest) and at most a few site lines.
- AGENTS.md is maintained by `next dev`: commit it, never edit it.
