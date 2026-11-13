---
paths:
  - "content/**"
---
# Content (content/*.ts)

> All visible text lives here, typed `as const`; replace every [placeholder] with specific, verifiable facts.

- One file per page (`export const <page> = { meta, <sectionKey>: {...} } as const`) plus `site.ts` (nav, header, footer).
- `meta.title` 50-60 characters, keyword first; `meta.description` 140-160 characters with one proof.
- Specific beats adjectives: numbers, names, places, dates, prices, guarantees. Never invent testimonials or figures:
  keep the placeholder and ask the user.
- Banned: cliches caught by the slop gate (elevate, seamless, unlock, cutting-edge...), em dashes, emoji, lorem ipsum.
- Internal links typed `'/route' as Route`. `content/meta.ts` is generated.
- Voice and copy method: `.claude/rules-ondemand/dss-copywriting.md`.
