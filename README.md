# daroms-speed-site

A Next.js website framework built for Claude Code. It turns a brief into a varied, production-grade website
(design, copy, SEO, security, data, deployment) at low token cost, so sites can be produced on a line.

Status: early development (0.1.0). See `CHANGELOG.md`.

## Principles

- **Claude Code native.** A small always-loaded kernel, rules loaded by path, forked Sonnet/Haiku skills for
  mechanical steps, guard hooks that refuse bad writes before they land, and a prompt router that says where to
  look instead of letting the agent explore.
- **Generate before writing.** The `dss` CLI produces pages, sections, content files, tables, forms and
  deployment config deterministically. The agent writes only what is specific to the site.
- **Varied by construction.** Every site gets a Design DNA (archetype, palette, type pairing, grid, texture,
  motion, 3D level) rolled to avoid combinations used by previous sites, plus anti-slop gates on copy and visuals.
- **Owned visual layer, versioned infrastructure.** Sections are copied into the site (free to reshape);
  SEO, security, data and deploy adapters stay in versioned core packages.

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Motion, three.js
(@react-three/fiber), Drizzle ORM (D1 / libSQL / Postgres), deploy to Cloudflare (OpenNext), Vercel or Docker.

## License

MIT
