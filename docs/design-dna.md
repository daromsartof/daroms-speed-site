# Design DNA

> Each site rolls a deterministic, accessible design identity that avoids the combinations of recent sites and the usual generated-site tells.

## Fields

`design.dna.ts` holds: archetype, font pairing, palette (mode, accent hue, chroma and lightness, neutral hue and tint,
secondary offset), type scale, grid, corner radius, rules, texture, density, imagery direction, motion profile and 3D
level. `pnpm dss theme` turns it into Tailwind v4 tokens (`app/theme.css`), next/font loaders (`app/fonts.ts`) and the
browser theme color.

## Archetypes

editorial, swiss, brutalist, luxury, organic, tech-noir, playful, retro-print, minimal-mono, magazine, architectural,
kinetic-type, craft, institutional. Each has a design read, allowed options, a signature to honour and an avoid list
(listed in `core/CATALOG.md`).

## Rolling

```bash
pnpm dss dna roll --mood warm,precise                 # new DNA, theme regenerated
pnpm dss dna roll --dry --seed acme-2                 # preview a candidate
pnpm dss dna roll --archetype swiss --mode dark --hue 20 --fonts archivo-wide
```

The roller scores candidates on industry fit and mood words, then penalises resemblance to the last twelve sites
recorded in `~/.dss/brain/dna-history.jsonl` and generic indigo/violet accents. Values are rounded so the saved file
renders exactly the same theme.

## Accessibility by construction

Text tokens are pushed in lightness until they meet WCAG minimums on both surfaces: ink 7:1, muted text and accent text
4.5:1, text on the accent 4.5:1. Hundreds of rolled DNAs are tested on every build.

## Anti-slop gates

The rule hook refuses default Tailwind palette classes, raw colors, emoji in copy, em dashes and generated-copy
cliches in `content/` (elevate, seamless, unlock, cutting-edge...). The `dss-critic` agent reviews captures against the
DNA and the avoid lists.
