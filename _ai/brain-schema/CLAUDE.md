# dss factory brain: schema

A persistent wiki that the agent maintains across every site built with dss (pattern: Karpathy's "LLM wiki",
page format inspired by gbrain). Knowledge is compiled once and kept current, so each new site starts from what
the previous ones learned instead of rediscovering it.

## Layers
- `raw/`: immutable sources (briefs, post-mortems, cost reports, inspiration notes). Never edit; add dated files.
- `wiki/`: pages the agent writes and rewrites. One topic per page.
- `index.md`: one line per page `- [Title](wiki/path.md): summary (tags)`, grouped by folder. Read it first, always.
- `log.md`: append-only, one line per operation: `## [YYYY-MM-DD] op | site | summary` (op: ingest, query, lint).
- `dna-history.jsonl`: the Design DNA of every site (written by the CLI, used against repetition).

## Folders
- `wiki/industries/<industry>.md`: what works for this kind of business (structure, proof, queries, pitfalls).
- `wiki/patterns/<name>.md`: section, layout, copy or motion ideas that worked (and where).
- `wiki/voice/<tone>.md`: voice notes with short examples.
- `wiki/fixes/<topic>.md`: errors met and their root-cause fix.
- `wiki/stacks/<module>.md`: module and deploy experience (forms, D1, Cloudflare...).
- `wiki/sites/<slug>.md`: one page per site: brief in 3 lines, DNA, pages, cost, lessons, URL.

## Page format
```
---
title: <title>
type: industry | pattern | voice | fix | stack | site
tags: [a, b]
updated: YYYY-MM-DD
---
<compiled truth: the current synthesis, rewritten when evidence changes; short, factual, actionable>

<!-- timeline -->
- **YYYY-MM-DD** | <site or source>: <what happened or was learned>
```

## Rules
- Ingest after each site: update 3-10 pages, then index.md and log.md. Prefer updating a page over creating one.
- Query: index.md first, then at most 3 pages; answer in at most 15 lines with page links.
- Lint (weekly): contradictions, stale claims, orphan pages, missing index lines, duplicated topics.
- Privacy: no client personal data (emails, phone numbers, private individuals' names, addresses of homes),
  no secrets, no prices agreed privately. Businesses and public facts only.
