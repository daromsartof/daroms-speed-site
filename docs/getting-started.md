# Getting started

> Create a site with one command, open it in Claude Code, and let the /dss-site skill take it from brief to deploy.

## Requirements

Node.js 22.18 or newer, pnpm 9, git, Python 3.10+ (hooks), and Claude Code. Docker or a Cloudflare/Vercel account
for deployment.

## Create a site

```bash
npx @daromsart/daroms-speed-site new atelier-nord --name "Atelier Nord" --preset vitrine \
  --industry "furniture workshop" --mood warm,crafted --url https://ateliernord.ch
cd atelier-nord
pnpm dev
```

`dss new` copies the template, attaches the framework in `core/` (git submodule, `--copy` for a self-contained
snapshot), installs dependencies, rolls a Design DNA, generates the preset's pages from registry sections, installs the
preset's modules (contact form, legal pages) and syncs the AI layer into `.claude/`.

Presets: `vitrine` (home, services, about, contact), `landing` (one conversion page), `portfolio` (work first),
`blank`.

## Build it with Claude Code

Open the folder in Claude Code and run:

```
/dss-site A furniture workshop in Lyon that makes forty solid-wood tables a year
```

The orchestrator walks through brief, research, inspiration, DNA, sitemap, copy, pages, SEO, checks, polish, deploy and
learning, with a checkpoint after each step. Mechanical steps run as forked Sonnet or Haiku skills.

Individual skills work on their own: `/dss-copy home`, `/dss-page /services`, `/dss-seo`, `/dss-check`, `/dss-edit`.

## Check and ship

```bash
pnpm dss doctor          # manifest, theme, pages, placeholders, types, lint
pnpm dss deploy          # noindexed preview
pnpm dss deploy --prod   # production (needs the real domain and no placeholders)
pnpm dss cost            # tokens and API-equivalent price per step
```
