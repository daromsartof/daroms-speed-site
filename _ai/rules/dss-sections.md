---
paths:
  - "components/sections/**"
---
# Sections (components/sections/*.tsx)

> Sections are owned code: typed props from content/, @dss/ui primitives, DNA tokens; first line stamp, then a @catalog JSDoc.

- Registry first: `pnpm dss add list`; `pnpm dss add section <id>[/variant] --page /route`. Bespoke: `pnpm dss g section <name>`.
- Keep the `// dss-section:` stamp; keep the `@catalog` line accurate (the router and CATALOG read it).
- Export `XProps` and `X`; no default export; props are data (strings, arrays, `{ src, alt }`), never JSX from content.
- Layout from the DNA grid (asymmetric spans, editorial-12, bento...). Avoid three equal cards; vary rhythm between sections.
- Interactivity in a small `"use client"` child component; the section itself stays a server component.
- Images through `Media` (ratio, sizes, alt); icons from lucide-react, sparingly, never inside coloured circles.
