---
name: dss-sitemap
description: Information architecture - pages, their sections and their target queries - applied to the manifest with dss g page and dss add section.
---

# /dss-sitemap: pages and sections

1. Read `site.spec.md` (Pages, Research, Design) and `core/CATALOG.md > Registry sections`.
2. For each page: route, nav label, target query, section list in order (registry ids, plus `bespoke:<name>` for the signature
   section), one h1. Vary section rhythm between pages; never the same sequence twice.
3. Show the plan as a table (AskUserQuestion: Apply / Adjust).
4. Apply: existing generated pages that change: `pnpm dss g page <route> --sections a,b,c --label "<Label>" --force` (only if
   their content is still placeholders); new pages: same without `--force`; bespoke: `pnpm dss g section <name> --page <route>`.
5. Remove pages the plan drops (page folder, content file, manifest entry), then `pnpm dss doctor --quick`.
6. **Stop**: the page list with their target query.
