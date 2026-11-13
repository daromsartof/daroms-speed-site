---
name: dss-design-system
description: Interface skill - translates generic design advice (vendored frontend-design, taste, web guidelines, Tailwind snippets) into dss terms - DNA tokens, @dss/ui primitives, registry sections.
---

# dss design system: translation table

Use when a vendored design skill or an external snippet suggests something; apply it the dss way.

- Raw colors, Tailwind palette (slate-900, indigo-500), CSS variables you invent -> DNA tokens (`core/CATALOG.md > Tokens`);
  a new color need -> change `design.dna.ts` (hue, chroma, mode) and `pnpm dss theme`.
- Font choices -> `design.dna.ts fonts` (a catalog pairing); never add <link> to Google Fonts (next/font is generated).
- Spacing scales -> `py-section`, `px-gutter`, gaps from Stack/Cluster/Grid; type scales -> `text-display-*`, `text-heading`.
- Components from shadcn or other kits -> @dss/ui primitives or a registry section; build bespoke only for the signature moment.
- "Make it bolder" -> one place: hero scale, a texture, an image sequence or a 3D accent according to the DNA level.
- Planning advice (palettes of 4-6 named colors, wireframes) -> write it in `site.spec.md > Design`, then express it with tokens.
