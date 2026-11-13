# daroms-speed-site

A Next.js website framework built for Claude Code. It turns a brief into a varied, production-grade website (design,
copy, SEO, security, data, deployment) at low token cost, so sites can be produced on a line.

```bash
npx @daromsart/daroms-speed-site new atelier-nord --preset vitrine --industry "furniture workshop" --mood warm
cd atelier-nord && pnpm dev
# then in Claude Code:  /dss-site A furniture workshop in Lyon that makes forty solid-wood tables a year
```

## Why it is different

- **Varied by construction.** Every site rolls a Design DNA (14 archetypes, 42 font pairings, OKLCH palettes with WCAG
  contrast guaranteed, grid, texture, motion, 3D level) that avoids the combinations of recent sites. A rule hook and a
  critic agent refuse the usual generated-site tells: default Tailwind palette, purple gradients, cliche copy, emoji.
- **Cheap for Claude.** A 57-line kernel, rules loaded by file path, a generated catalog instead of source reading,
  deterministic generators, forked Sonnet/Haiku skills, a prompt router, guard hooks that refuse bad writes before they
  land, and `dss cost` reports per step.
- **A production line.** A factory brain shared by all sites (what worked per industry, patterns, fixes), a sites
  registry, batch creation from briefs, upgrades and releases.
- **Solid defaults.** Next.js 16 static pages, strict CSP and security headers, `safeAction` for every form, SEO and
  JSON-LD from the manifest, noindexed previews, Lighthouse mobile 96-100 on generated pages.

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Radix primitives, CSS scroll-driven motion,
three.js via @react-three/fiber (lazy, poster fallback), Drizzle ORM (Cloudflare D1, libSQL, Postgres), deploy to
Cloudflare Workers (OpenNext), Vercel or Docker. AimKit for visual edits from the browser.

## In the box

| Area     | What                                                                                                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLI      | `dss new`, `dev`, `doctor`, `dna`, `theme`, `g page/section`, `add section/scene`, `module`, `db init`, `deploy`, `sites`, `brain`, `mcp`, `aimkit`, `upgrade`, `factory`, `cost` |
| Registry | 26 section variants (heroes, services, features, stories, testimonials, pricing, projects, team, gallery, FAQ, CTA...) and 2 three.js scenes                                      |
| Modules  | forms (Resend, Turnstile), legal (GDPR, nLPD), analytics (cookieless), blog (Markdown, RSS, JSON-LD)                                                                              |
| AI layer | 24 dss skills, 5 agents, 11 vendored community skills (name-only), 6 Python hooks, factory brain                                                                                  |
| MCP      | aimkit and next-devtools by default; opt-in MotionSites, 60fps, Context7, Playwright, gbrain                                                                                      |

## Docs

Start with [docs/index.md](docs/index.md): getting started, architecture, Design DNA, AI layer, modules, deploy,
AimKit, factory and the CLI reference. Agents can read [docs/llms.txt](docs/llms.txt) and
[docs/llms-full.txt](docs/llms-full.txt).

## Develop the framework

```bash
pnpm install
pnpm check              # types, lint, format, Vitest, hook tests
pnpm catalog && pnpm run docs   # `pnpm docs` alone is npm docs
node cli/dss.ts new demo --link     # try changes in a linked site
pnpm verify:registry <site-dir>     # type-check every registry section inside a site
```

## License

MIT. Vendored third-party skills keep their own licenses (see `_ai/skills/vendor/README.md`).
