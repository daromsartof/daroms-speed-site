---
name: dss-polish
description: Design polish by the dss-critic and dss-designer agents - generated-look tells, DNA fidelity, hierarchy, spacing, motion, accessibility - then applies at most two rounds of fixes.
context: fork
background: false
model: sonnet
effort: medium
---

# /dss-polish: does not look generated

1. Build and serve (`pnpm build && pnpm start`), then capture each page at 1440 and 390 wide:
   `google-chrome --headless=new --hide-scrollbars --window-size=1440,2400 --screenshot=.dss/shots/<page>.png http://localhost:3000<route>`.
2. Ask the `dss-critic` agent (captures + `site.spec.md > Design` + `core/CATALOG.md > Archetypes`) for at most 10 fixes ranked by impact.
3. Ask the `dss-designer` agent for hierarchy, spacing, states and accessibility issues (at most 10).
4. Apply fixes with DNA tokens and owned sections; no new dependency. Re-capture changed pages. At most two rounds.
5. **Stop**: fixes applied, one line each.
