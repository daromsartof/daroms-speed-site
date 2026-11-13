# Architecture

> Versioned infrastructure in core packages, owned visual code in the site, data files the CLI rewrites, generated files nobody edits.

## Core and site

```
core/ (the framework)          site (the client project)
  packages/  @dss/*              site.manifest.ts   pages, modules, deploy, SEO, CSP, redirects
  registry/  sections, scenes    design.dna.ts      the Design DNA
  modules/   forms, blog...      content/*.ts       every visible word, typed
  template/  base site, presets  app/               thin pages: metadata + sections
  _ai/       AI layer            components/        owned sections, site chrome, 3D scenes
  cli/       dss                 server/            database and server actions
```

The core is attached as a git submodule pinned to a commit or tag (`--copy` makes a snapshot for client handoff,
`--link` symlinks a framework checkout for development). Claude never edits `core/` from a site (permission deny).

## Packages

| Package         | Role                                                                                   |
| --------------- | -------------------------------------------------------------------------------------- |
| `@dss/site`     | `defineManifest` (zod) and `withDss`: headers, CSP, images, redirects, deploy output   |
| `@dss/design`   | Design DNA, archetypes, font pairs, OKLCH palettes, theme generators                   |
| `@dss/ui`       | token-driven primitives (Section, Heading, Media, ButtonLink, Accordion...)            |
| `@dss/seo`      | metadata, canonical, hreflang, JSON-LD, robots, sitemap, llms.txt, noindex on previews |
| `@dss/security` | static CSP and presets, `safeAction`, Turnstile, rate limiting, env validation         |
| `@dss/motion`   | CSS scroll-driven motion, marquee, split words, count-up                               |
| `@dss/three`    | lazy three.js `<Scene>` with poster fallback                                           |
| `@dss/data`     | Drizzle on D1, libSQL or Postgres                                                      |
| `@dss/aimkit`   | vendored AimKit bridge, MCP server and Chrome extension                                |

Packages are TypeScript sources. Config-time imports (`next.config.ts`, `site.manifest.ts`, the CLI) go through
Node-safe entries loaded with Node's type stripping.

## Ownership rules

- **Generated, never edited**: `app/theme.css`, `app/fonts.ts`, `app/theme.ts`, `content/meta.ts`, `lib/modules.ts`,
  `components/site/module-slots.tsx`, `core/CATALOG.md`, `_ai/digest.md`.
- **Data files rewritten by the CLI**: `site.manifest.ts`, `design.dna.ts` (keep literal values).
- **Owned by the site**: sections copied from the registry (each keeps a `// dss-section:` stamp and a `@catalog`
  line), module files, everything in `content/`.
- **AI files**: `dss-*` entries in `.claude/` are overwritten by the sync; site-specific ones use `site-`.
