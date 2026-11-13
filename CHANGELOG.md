# Changelog

All notable changes to daroms-speed-site. Versions follow `VERSION`.

## 0.1.0 (unreleased)

- Repository skeleton: pnpm workspace, `@dss/config` (strict TypeScript base with type-stripping-safe flags,
  shared flat ESLint config for core and sites, Prettier), Vitest, CI.
- Golden site template (Next 16.4.6, React 19.3, Tailwind v4 with explicit sources, typed routes, static CSP and
  security headers, copy in `content/`, generated `fonts.ts`/`theme.css`/`theme.ts` placeholders, exact Next
  `AGENTS.md` block). Verified: all routes static, OpenNext Cloudflare build + `wrangler deploy --dry-run`
  (static-assets incremental cache, ~1 MiB gzip worker), local workerd serving headers, Docker standalone image,
  `core/` attached as a git submodule, `cacheComponents` on and off.
- Core packages (TypeScript sources, Node-safe subpaths for config-time imports):
  - `@dss/design`: Design DNA schema, 14 archetypes, 42 curated font pairings validated against next/font data,
    OKLCH palettes with WCAG minimums enforced by construction (ink 7:1, muted/accent text 4.5:1), deterministic
    roller scoring industry/mood fit and penalising resemblance to recent sites and the generic indigo/violet band,
    generators for `theme.css` (Tailwind v4 tokens, type scale, radius, density, motion, textures), `fonts.ts`,
    `theme.ts` and a monogram `icon.svg`.
  - `@dss/security`: static CSP builder with presets (Turnstile, Plausible, Umami, Cloudflare Analytics, YouTube,
    Vimeo, Cal.com, Maps, Stripe), security headers, `safeAction` (honeypot, rate limit per IP, Turnstile, zod,
    sanitised errors), lazy env validation, rate limiters (memory, Workers binding), client IP.
  - `@dss/site`: `defineManifest` (zod, readable errors) and `withDss` (headers, CSP from manifest and modules,
    images, redirects, trailing slash, standalone output for Docker, refuses nonce CSP with cacheComponents).
  - `@dss/seo`: root and page metadata (canonical, hreflang + x-default, noindex on previews), JSON-LD builders
    with a `<`-escaped graph, robots (AI training crawler policy), sitemap, llms.txt.
  - `@dss/ui`: token-driven primitives (Container, Section, Stack, Cluster, Grid, Heading, Text, Eyebrow, Prose,
    Button, ButtonLink, Media, SkipLink, VisuallyHidden, Accordion on Radix).
  - `@dss/data`: Drizzle on SQLite (D1 binding, libSQL), id/timestamp columns, drizzle-kit config per driver.
- Template now uses the manifest, the DNA and the packages. Golden page: Lighthouse mobile 96 performance,
  100 accessibility, 100 best practices, 100 SEO; OpenNext build green.
- `dss` CLI (TypeScript run by Node in a site, esbuild bundle for npm): `new` (template copy, core as submodule pinned
  to the creating commit, `--copy` snapshot or `--link`, install, DNA roll with history, preset pages), `dna roll|show`,
  `theme`, `g page|section`, `add list|section`, `doctor` (manifest, theme freshness, pages, placeholders, types, lint),
  `dev`. Verified: vitrine and landing presets build fully static in submodule, copy, link and npm-installed modes.
- Section registry (10 sections: hero, features, services, story, testimonials, cta, faq, contact, stats, steps) with
  version stamps, JSON placeholder copy and archetype fit; presets `vitrine`, `landing`, `blank`; site chrome (header
  with no-JS mobile menu, footer, skip link) and placeholder images flagged by `dss doctor`.
