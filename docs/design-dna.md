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

## Taste measures

The hook reads source; `pnpm dss shot <route>` counts on the rendered page, at 1440 and 390 wide, what gives a generated
site away. A number cannot be argued with, while "make it look better" only invites a new set of defaults. The
reference is the generated `app/theme.css`, so a measure fails when the page drifts from its DNA.

| Measure                         | Max                 | What is counted                                                                                       |
| ------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------- |
| off-palette hues                | 0                   | vivid colors whose hue matches no DNA color token                                                     |
| radii off the DNA scale         | 0                   | radii other than `--radius-card`, `-control`, `-media` (pills and elements under 24 px skipped)       |
| type sizes                      | DNA scale + 3       | distinct font sizes on the page                                                                       |
| font families                   | display, body, mono | families rendered                                                                                     |
| colourful gradients             | 0                   | gradients with saturated stops; DNA textures and neutral scrims over images are fine                  |
| emoji                           | 0                   | emoji in rendered text, data included                                                                 |
| one destination, several labels | 0                   | links in `<main>` to one page under different labels (hero "Book a visit", footer CTA "Get in touch") |
| one label, several destinations | 0                   | the same label to different pages ("Learn more" three times)                                          |
| actions without a name          | 0                   | links and buttons with no text and no `aria-label`                                                    |
| targets < 24px                  | 0                   | WCAG 2.5.8 minimum, with its spacing exception; inline text links exempt                              |

```text
/ [390] 200: ok
  headings: h1 "Forty solid-wood tables a year" · 5 h2
  measure radii off the DNA scale: 1 (max 0) 6px: Get a quote
  measure one label, several destinations: 1 (max 0) "learn more": /services / /about
```

The report also lists console errors, horizontal overflow and the h1 count. Measures do not fail the command;
`/dss-section`, `/dss-check` and `/dss-polish` fix them, unless `site.spec.md > Design` records the exception.
`dss shot` starts `next dev` on port 3123 the first time and reuses it (`--stop` ends it, `--url` targets any server).
