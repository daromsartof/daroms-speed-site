---
paths:
  - "**/*.tsx"
  - "app/globals.css"
---
# Styles (Tailwind v4 + DNA tokens)

> Only DNA token classes: no hex/rgb, no arbitrary colors, no default Tailwind palette (bg-slate-900, text-indigo-500), no inline style.

- Colors: surface, surface-2, surface-3, ink, ink-muted, line, rule, accent, accent-ink, accent-text, secondary (bg-/text-/border-).
- Type: font-display / font-body / font-mono; sizes text-display-2xl, -xl, -lg, text-heading, text-subheading, text-body-lg.
- Space and shape: py-section, px-gutter, max-w-content, max-w-prose, rounded-card / rounded-control / rounded-media, rule-t, rule-b.
- Motion tokens: `duration-(--duration-brand) ease-brand`. Textures: texture-grain, texture-halftone, texture-grid, texture-mesh.
- Change the look in `design.dna.ts` + `pnpm dss theme`; never edit app/theme.css. Opacity modifiers are fine (text-surface/80).
- `globals.css` scans app/, components/, content/ and core/packages/ui only (`source(none)`): add an @source for a new folder.
