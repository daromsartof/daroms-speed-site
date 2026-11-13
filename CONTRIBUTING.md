# Contributing

Thanks for helping. dss is a framework for producing websites with Claude Code; changes should keep sites varied,
fast, secure and cheap in tokens.

## Setup

```bash
pnpm install
pnpm check                          # types, lint, format, Vitest, hook tests
node cli/dss.ts new demo --link     # try a change in a site linked to this checkout
pnpm verify:registry <site-dir>     # type-check every registry section inside a site
pnpm --filter @dss/website dev      # the docs site (content comes from docs/)
```

Node.js 22.18 or newer, pnpm 9.

## Rules

- Framework changes happen here, never in a site's `core/`.
- Keep files under 250 lines, no `any`, explicit `.ts` imports in Node-safe entries.
- Generated files (`CATALOG.md`, `_ai/digest.md`, `docs/cli.md`, `docs/llms*.txt`) come from `pnpm catalog`,
  `node cli/dss.ts sync-ai` and `pnpm run docs`: regenerate, never edit.
- Every behaviour change ships with a test (Vitest for the CLI and packages, `unittest` for the hooks) and a line in
  `CHANGELOG.md`.
- Docs are Markdown in `docs/`, each with a `# Title` and a one-line `> summary`.

## Pull requests

One topic per pull request, `pnpm check` green, and a short description of what changed and how it was verified.
Releases are cut by the maintainer with `pnpm dss release-core`.
