---
name: dss-brain-lint
description: Keeps the factory brain healthy - contradictions, stale claims, orphan or duplicated pages, missing index lines, privacy leaks - and fixes them.
context: fork
background: false
model: haiku
---

# /dss-brain-lint: brain hygiene

1. `pnpm dss brain status`; read `~/.dss/brain/CLAUDE.md` and `index.md`.
2. Fix orphans (add index lines), duplicates (merge into one page, keep both timelines), contradictions (keep the
   newer evidence in the compiled truth, note the change in the timeline), stale claims (mark or remove).
3. Scan for personal data (emails, phone numbers, private names) and secrets; remove them.
4. `pnpm dss brain log lint brain "<summary>"`. **Stop**: fixes, one line each.
