---
name: dss-polish
description: Design polish by the dss-critic and dss-designer agents - generated-look tells, DNA fidelity, hierarchy, spacing, motion, accessibility - then applies at most two rounds of fixes.
context: fork
background: false
model: sonnet
effort: medium
---

# /dss-polish: does not look generated

1. Capture each page at 1440 and 390 wide: `pnpm dss shot <route> --capture` (captures in `.dss/shots/`). Keep the `measure` lines.
2. Measures first: fix every failing measure (a count is not up for debate), unless `site.spec.md > Design` records the exception.
3. Ask the `dss-critic` agent (captures, remaining measures, `site.spec.md > Design`, `core/CATALOG.md > Archetypes`) for at most 10 fixes ranked by impact.
4. Ask the `dss-designer` agent for hierarchy, spacing, states and accessibility issues (at most 10).
5. Apply fixes with DNA tokens and owned sections; no new dependency. Re-run `pnpm dss shot` on changed pages until measures are ok. At most two rounds.
6. **Stop**: fixes applied, one line each.
