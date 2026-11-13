# daroms-speed-site: kernel (always loaded)

Next.js 16 website (App Router, React 19, Tailwind v4, TypeScript strict) built on the dss core in `core/`.
Goal: a production-grade site that does not look generated, at the lowest token cost. The core provides
everything repetitive; the site writes only what is specific to it. Never edit `core/` from a site.

## Before any task
1. Read `site.spec.md` (the brief) and `core/CATALOG.md` (components, sections, tokens, archetypes, APIs). Never read core sources.
2. One task per session; `/clear` between topics. Parallel reads; the Explore agent for broad searches.
3. Generate before writing: `pnpm dss g page|section`, `pnpm dss add section`, `pnpm dss dna roll`, `pnpm dss theme`.
4. Next.js docs: grep `node_modules/next/dist/docs/` for the topic; never read whole guides, never web-search first.

## Site map
- `site.manifest.ts`: pages, modules, deploy, SEO, CSP, redirects (the CLI rewrites it; keep literal values).
- `design.dna.ts`: Design DNA. `app/theme.css`, `app/fonts.ts`, `app/theme.ts`, `content/meta.ts` are generated: never edit.
- `content/<page>.ts`: every visible word, typed. `[Brackets]` are placeholders to replace with real facts.
- `app/**/page.tsx`: thin: metadata + sections fed from content. `components/sections/*.tsx`: owned section code
  (each starts with a `@catalog` line: `grep -h @catalog components/sections/*.tsx` lists them).
- `components/site/` header and footer; `components/3d/` client-only scenes; `server/` db and actions.

## Non-negotiable rules (detail in `.claude/rules/`, loaded by file path)
- Styling: DNA token classes only (bg-surface, text-ink, text-ink-muted, bg-accent, text-accent-text, border-line,
  font-display, text-display-xl, py-section, px-gutter, rounded-card). No hex/rgb, no default Tailwind palette, no inline style.
- Copy: in `content/`, specific and verifiable (numbers, names, places). No cliches, no em dashes, no emoji, no lorem.
- Server components by default; `"use client"` only in small leaf components. `next/image` via Media; `next/link` for internal links.
- SEO: `pageMetadata` on every page, one h1, JSON-LD through @dss/seo. Never hand-write <meta> or <script>.
- Data and forms: Drizzle only in `server/`; every action through `safeAction` (zod, rate limit, Turnstile on public forms).
- Secrets: server-side only (`defineEnv`), never `NEXT_PUBLIC_` secrets, never read `.env*` or `.dev.vars`.
- 3D only in `components/3d/` through `<Scene>`; motion with `motion/react` or CSS, reduced-motion aware. No GSAP.
- Files <= 250 lines, no `any`, absolute imports `@/`. AI files: `dss-*` in `.claude/` are overwritten on sync; site ones use `site-`.

## Next.js 16 (differs from training data)
- `middleware.ts` is `proxy.ts` (`export function proxy`, Node runtime). Prefer manifest headers/redirects over a proxy.
- `params`, `searchParams`, `cookies()`, `headers()` are async; type pages with `PageProps<'/route'>` (`next typegen`).
- `revalidateTag(tag, 'max')` takes a profile; `updateTag(tag)` only in Server Actions; `"use cache"` + `cacheLife()`.
- Turbopack builds; never add a `webpack()` hook. `next lint` is gone: `pnpm lint` (ESLint CLI). `<ViewTransition>` from 'react'.
- Static CSP by default (pages stay static). A nonce CSP makes every page dynamic: read the csp-nonce rule first.

## Design that does not look generated
- The DNA decides archetype, type pairing, palette, grid, texture, motion and 3D level. Follow its signature and avoid list
  (CATALOG.md > Archetypes). Spend boldness in one place: the hero or one signature section is bespoke on every site.
- Never: centered hero over a gradient mesh + three equal icon cards, purple/indigo gradients, glassmorphism by default,
  ALL-CAPS eyebrows with arrows everywhere, stock "team smiling at laptop" imagery, invented testimonials or numbers.

## Work loop
- Write; hooks check rules before the write and types/lint after it (short message: fix, never work around).
- Visual check: `pnpm dss shot /route` when available, otherwise `pnpm build` + review. Visual edits from the browser: /dss-edit.
- Before handing back: `pnpm dss doctor` (theme, pages, placeholders, types, lint). End of task: /dss-learn then /dss-commit.

## Commands
`pnpm dss`: `new`, `dev`, `doctor [--quick --strict]`, `dna show|roll`, `theme`, `g page|section`, `add list|section|scene`,
`module list|add|remove` (forms, legal, analytics, blog), `db init`, `catalog`, `sync-ai`, `cost`. Skills: `/dss-site` (whole site, step by step), `/dss-brief`, `/dss-dna`, `/dss-sitemap`, `/dss-copy`,
`/dss-page`, `/dss-section`, `/dss-seo`, `/dss-check`, `/dss-polish`, `/dss-deploy`, `/dss-edit`, `/dss-fix`, `/dss-learn`, `/dss-commit`.

## Answer style
Short and factual, in the user's language. No recap of what tool output already shows.
