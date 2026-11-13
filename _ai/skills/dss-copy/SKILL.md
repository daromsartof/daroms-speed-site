---
name: dss-copy
description: Writes the copy of one page in content/<page>.ts from site.spec.md - specific, verifiable, in the brand voice - replacing placeholders and leaving only facts to ask for.
argument-hint: "<page name, e.g. home>"
context: fork
background: false
model: sonnet
effort: medium
---

# /dss-copy: one page of copy

Page: $ARGUMENTS

1. Read `site.spec.md` (Pitch, Audience, Offer, Proof, Voice, SEO targets, Research) and `.claude/rules-ondemand/dss-copywriting.md`.
2. Open `content/<page>.ts` (and `content/site.ts` for the home page: tagline, description, nav, header, footer, llms summary).
3. Replace each `[placeholder]` keeping the exact shape (keys, arrays, hrefs). Meta title 50-60 chars, description 140-160.
   The h1 states the outcome; the first 100 words answer the page's main query.
4. Facts not in the spec (prices, numbers, names, quotes, addresses): keep the bracket and add the item to `site.spec.md > Open facts`.
5. The slop gate rejects cliches: rewrite with specifics, never work around it.
6. `pnpm dss doctor --quick`. **Stop**: placeholders left (count) and the open facts added.
