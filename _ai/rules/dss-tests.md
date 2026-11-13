---
paths:
  - "**/*.test.ts"
  - "lib/**/*.ts"
  - "server/**/*.ts"
---
# Unit tests

> Pure logic in `lib/` and `server/` gets a `*.test.ts` next to it, run by `pnpm test` (Node's built-in runner).

- `import { test } from 'node:test'` and `import assert from 'node:assert/strict'`; no test framework to install.
- Relative imports with the `.ts` extension (`./check-link.ts`): Node runs the file by stripping types, no aliases.
- Test behaviour that matters to visitors or security (parsers, validators, formatters), including hostile input.
- Keep React components out of unit tests; check them with `pnpm build` and the browser.
