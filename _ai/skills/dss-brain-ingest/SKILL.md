---
name: dss-brain-ingest
description: After a site (or a notable task), compiles its lessons into the factory brain - site page, industry page, patterns, fixes, stacks - updating the index and the log, without client personal data.
argument-hint: "[site slug]"
context: fork
background: false
model: sonnet
effort: medium
---

# /dss-brain-ingest: compile the lessons

Site: $ARGUMENTS

1. Read `~/.dss/brain/CLAUDE.md` (schema) and `index.md`. Missing: `pnpm dss brain init`.
2. Sources: `site.spec.md` (Pitch, Research, Design, Journal, Launch), `site.cost.md`, `git log --oneline -30`,
   `design.dna.ts`, `site.manifest.ts` (pages, modules). Copy the brief to `raw/<date>-<slug>-brief.md` (never edit raw files).
3. Write or update 3-10 pages: `wiki/sites/<slug>.md` (always), `wiki/industries/<industry>.md`, and patterns, voice,
   fixes or stacks pages for real lessons. Rewrite the compiled truth when evidence changes; append dated timeline lines.
4. Privacy: businesses and public facts only; no emails, phone numbers, private names, home addresses, secrets.
5. Update `index.md` (one line per page, right folder) and `pnpm dss brain log ingest <slug> "<summary>"`.
6. `pnpm dss brain status` must show no orphan page. **Stop**: pages touched, one line each.
