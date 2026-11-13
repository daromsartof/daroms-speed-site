---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---
# Naming and files

> PascalCase components, useX hooks, kebab-case files and routes, files <= 250 lines, no `any`, `@/` imports.

- Named exports (pages and Next special files excepted). Types next to their component (`XProps`).
- `unknown` + zod at boundaries instead of `any`; no non-null `!` on external data.
- Split a file at 250 lines (sub-components, `lib/` pure functions with tests).
