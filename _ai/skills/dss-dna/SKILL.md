---
name: dss-dna
description: Locks the Design DNA - rolls candidates with the brief's industry, moods and inspiration wishes, avoids recent sites, shows the Design Read, regenerates the theme.
argument-hint: "[--archetype --mode --hue --fonts overrides]"
---

# /dss-dna: Design DNA

Overrides: $ARGUMENTS

1. Read `site.spec.md` (Voice, Inspiration) and `core/CATALOG.md > Archetypes` and `> Font pairings`.
2. Dry-run 3 candidates: `pnpm dss dna roll --dry --seed <slug>-1 --mood <moods> [locks]`, then `-2`, `-3` (vary locks if they converge).
3. Present them (AskUserQuestion with the three Design Read lines; recommend one and say why in a few words).
4. Apply the choice: `pnpm dss dna roll --seed <chosen seed> --mood <moods> [locks]` (writes design.dna.ts and the theme).
5. Write `site.spec.md > Design`: the Design Read line, the archetype signature to honour, the avoid list, and the one signature moment.
6. `pnpm dss doctor --quick`. **Stop**: the Design Read line.
