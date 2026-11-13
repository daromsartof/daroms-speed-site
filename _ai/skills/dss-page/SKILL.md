---
name: dss-page
description: Finishes one page - composition from content, the bespoke signature section when the plan has one, DNA-faithful layout, accessibility - verified with a build.
argument-hint: "<route> [instruction]"
context: fork
background: false
model: sonnet
effort: medium
---

# /dss-page: one page

Target: $ARGUMENTS

1. Read `site.spec.md > Design` (signature, avoid list) and the page's plan in `> Pages`; `core/CATALOG.md` for tokens and components.
2. Read `app<route>/page.tsx`, its `content/<page>.ts` and the section files it uses (`grep -h @catalog components/sections/*.tsx`).
3. Bespoke section (if planned): build it in `components/sections/<name>.tsx` with @dss/ui primitives and DNA tokens; this is where the
   page earns its personality (archetype signature: oversized type, plan-like lines, halftone, image sequence, 3D accent...).
4. Adjust registry sections only where the DNA or content needs it (they are site-owned); keep their stamp and @catalog line.
5. Check: one h1, alt texts, link labels, no placeholder image on this page if a real one exists.
6. `pnpm dss doctor` (types and lint). **Stop**: what changed in 2 lines.
