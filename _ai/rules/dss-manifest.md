---
paths:
  - "site.manifest.ts"
  - "design.dna.ts"
---
# Manifest and DNA

> site.manifest.ts and design.dna.ts are data files rewritten by the CLI: literal values only, validated at import.

- Pages, modules, deploy target, db driver, SEO organisation, CSP presets and redirects live in the manifest.
- DNA changes: `pnpm dss dna roll [--archetype --mode --hue --fonts --mood]` or edit values, then `pnpm dss theme`.
- After editing either file run `pnpm dss doctor --quick`.
