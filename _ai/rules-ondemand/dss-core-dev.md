# Working on the core

> Change the framework in the daroms-speed-site repository (never in a site's core/); test, then release.

- `pnpm check` (types, lint, format, vitest) and `python3 -m unittest discover -s _ai/hooks/tests`.
- New section: registry/sections/<id>/<variant>/{section.tsx, example.json, meta.json}; then `pnpm catalog`.
- Try it in a linked site: `node cli/dss.ts new demo --link`.
