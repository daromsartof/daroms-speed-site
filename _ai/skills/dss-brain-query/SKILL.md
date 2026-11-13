---
name: dss-brain-query
description: Asks the factory brain what previous sites learned about an industry, pattern, voice or problem - index first, at most three pages, at most fifteen lines back.
argument-hint: "<industry, pattern or problem>"
context: fork
background: false
model: haiku
---

# /dss-brain-query: what we already know

Topic: $ARGUMENTS

1. `pnpm dss brain query "<topic>"` lists matching index lines (brain at `~/.dss/brain`, or `$DSS_BRAIN`). Nothing: say so and stop.
2. Read at most 3 of the listed pages (compiled truth first; the timeline only if dates matter).
3. Keep only what changes a decision for the current site: structure, proof to collect, queries, sections, copy angles,
   pitfalls, fixes. Drop anything generic.
4. `pnpm dss brain log query <site-slug> "<topic>"`.
5. **Stop**: at most 15 lines, each ending with its page path.
