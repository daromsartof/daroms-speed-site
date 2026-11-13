---
name: dss-brief
description: Writes site.spec.md from a short interview - business, audience, goals, pages, SEO targets, voice, proof, legal - the single source every other step reads.
argument-hint: "<idea or business description>"
---

# /dss-brief: the site brief

Input: $ARGUMENTS

1. If a `site.spec.md` exists, read it; otherwise start from `core/template/site.spec.md` (copied by `dss new`) or create it with the same headings.
2. Ask at most 4 grouped questions (AskUserQuestion), only for what the input does not answer:
   business and offer; audience and the one action that matters (call, book, buy, contact); city or market and language;
   proof available (figures, clients, years, photos, testimonials); voice (3 adjectives) and sites they like or hate.
3. Fill `site.spec.md`: Pitch (2 sentences), Audience, Primary action, Offer (services with price if known), Proof,
   Voice, Market and languages, SEO targets (5-10 queries people type, in the site language), Pages (first guess), Legal
   (owner, registration, address), Open facts (everything still unknown).
4. Never invent facts: unknowns go to Open facts.
5. **Stop**: the pitch and the primary action in 2 lines.
