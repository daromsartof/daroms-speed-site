---
name: dss-polish
description: Design polish by the dss-critic and dss-designer agents - scores out of 10, generated-look tells, DNA fidelity, hierarchy, spacing, accessibility - then applies at most two rounds of fixes.
context: fork
background: false
model: sonnet
effort: medium
---

# /dss-polish: does not look generated

1. Capture each page at 1440 and 390 wide: `pnpm dss shot <route> --capture` (captures in `.dss/shots/`). Keep the `measure` lines.
2. Measures first: fix every failing measure (a count is not up for debate), unless `site.spec.md > Design` records the exception.
3. Ask the `dss-critic` agent (captures, remaining measures, `site.spec.md > Design`, `core/CATALOG.md > Archetypes`): scores, critical items, at most 10 fixes ranked by impact.
4. Ask the `dss-designer` agent for hierarchy, spacing, states and accessibility issues (at most 10).
5. Apply every critical item and every high-impact fix with DNA tokens and owned sections; a better solution than a listed fix is fine, say why. Do not regress what scored well; no new dependency. Re-run `pnpm dss shot` on changed pages until measures are ok.
6. Second round only while a score stays < 7 or a critical item remains: new critique of the changed pages, given the previous one. At most two rounds.
7. **Stop**: scores before -> after (one line per dimension), then the fixes applied or skipped (one line each, reason when skipped).
