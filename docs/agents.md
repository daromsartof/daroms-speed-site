# For AI agents

> The operating manual for an agent (Claude Code or any coding agent): what to read, how to start a site, the contract every site follows and the checks to run before saying done.

## Read this documentation as Markdown

- Every page of the docs site has a raw Markdown twin: append `.md` to the page name (`getting-started.md`,
  `agents.md`, `catalog.md`).
- `llms.txt` lists every page with a one-line summary; `llms-full.txt` is the whole documentation and the catalog in
  one file. Load `llms-full.txt` once instead of crawling pages.

## Inside a generated site

- `CLAUDE.md` loads the kernel (`core/_ai/CLAUDE.core.md`, under 60 lines) and the rules digest. Detailed rules load
  by file path from `.claude/rules/`.
- `site.spec.md` is the brief and the single source of facts; its `Journal` records decisions, `Open facts` what is
  still unknown.
- `core/CATALOG.md` lists tokens, components, sections, modules, archetypes and package APIs. Never read core sources.

## Start a site

```bash
npx @daromsart/daroms-speed-site new <slug> --preset vitrine --industry "<industry>" --mood "<two or three words>"
cd <slug> && pnpm dev
```

Then `/dss-site <one-sentence idea>` in Claude Code (a checkpoint after each step), or headless for a batch:
`pnpm dss factory run ./briefs --out ./sites --agent` (decisions go to the Journal, the run stops before deploy).

## The contract

| What                        | Where                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| Every visible word          | `content/<page>.ts`, typed `as const`                                                               |
| Pages                       | `app/**/page.tsx`: metadata and sections only                                                       |
| Sections                    | `components/sections/*.tsx`: owned code, a `// dss-section:` stamp and a `@catalog` line            |
| Look and feel               | `design.dna.ts`, then `pnpm dss theme`; generated theme files are never edited                      |
| Pages, modules, deploy, CSP | `site.manifest.ts`, rewritten by the CLI                                                            |
| Forms and mutations         | `server/actions/*` through `safeAction`                                                             |
| Unknown facts               | `[placeholders]` plus `site.spec.md > Open facts`; never invent testimonials, numbers or legal data |
| Studio credit               | the footer link to https://daromsart.xyz/ (`content/site.ts > footer.credit`) stays on every site   |

## Commands

- Generate before writing: `pnpm dss g page|section`, `pnpm dss add section <id>`, `pnpm dss module add <slug>`,
  `pnpm dss dna roll`, `pnpm dss db init`.
- Check: `pnpm dss doctor` (theme, pages, placeholders, credit, types, lint), `pnpm test`, `pnpm build`.
- Ship: `pnpm dss deploy` (noindexed preview), `pnpm dss deploy --prod` (needs the real domain and
  `doctor --strict`), then `pnpm dss cost`.

## Guard rails

Hooks refuse a write before it lands and say why in one line: fix the cause, never work around it.

- DNA token classes only: no hex or rgb, no default Tailwind palette, no inline style.
- No hard-coded copy in JSX, no em dashes, no generated-copy cliches, no emoji.
- No `any`, files under 250 lines, Next.js 16 APIs (`proxy.ts`, async `params`, `revalidateTag(tag, profile)`).
- Secrets stay server-side; `.env*` and `.dev.vars` are never read.
- A reasoned exception takes a `dss-ignore` comment on the line.

## Headless runs

- A new folder is not a trusted workspace: Claude Code ignores the project's `permissions.allow`. `factory run` passes
  the rules on the command line; for a manual `claude -p`, pass `--allowedTools` with the rules from
  `.claude/settings.json`.
- Each shell command must match an allow rule: prefer the Read and Grep tools to compound shell pipelines.
- Done means verified: doctor, tests and build pass, and the result names what could not be checked.
