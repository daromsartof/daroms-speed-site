// Command table: shared by the entry point (dispatch, help) and the docs generator.
import type { Args } from './lib/args.ts'

export type Command = { describe: string; run: (args: Args) => Promise<void> }

export const COMMANDS: Record<string, Command> = {
  new: {
    describe:
      'new <slug> [--name --preset vitrine|landing|blank --industry --mood a,b --seed --url --target --modules a,b --copy|--link|--core <url>]',
    run: async (a) => (await import('./commands/new.ts')).newSite(a),
  },
  dev: {
    describe: 'dev [--port 3000 --https --no-aimkit]: next dev + AimKit bridge (element picker)',
    run: async (a) => (await import('./commands/dev.ts')).dev(a),
  },
  doctor: {
    describe:
      'doctor [--quick --strict]: manifest, DNA, theme files, pages, placeholders, types, lint',
    run: async (a) => (await import('./commands/doctor.ts')).doctor(a),
  },
  dna: {
    describe:
      'dna show | dna roll [--industry --mood a,b --archetype --mode --hue --fonts --seed --dry]',
    run: async (a) => (await import('./commands/dna.ts')).dna(a),
  },
  theme: {
    describe: 'theme: regenerate theme.css, fonts.ts, theme.ts from design.dna.ts',
    run: async (a) => (await import('./commands/theme.ts')).theme(a),
  },
  g: {
    describe:
      'g page <route> [--name --label --sections a,b --no-nav --force] | g section <name> [--page /route]',
    run: async (a) => (await import('./commands/generate.ts')).generate(a),
  },
  add: {
    describe:
      'add list | add section <id[/variant]> [--page /route --force] | add scene <id>: copy registry code into the site',
    run: async (a) => (await import('./commands/add.ts')).add(a),
  },
  module: {
    describe:
      'module list | add <slug> [--config k=v --page /route] | remove <slug>: forms, legal, analytics, blog...',
    run: async (a) => (await import('./commands/module.ts')).moduleCommand(a),
  },
  db: {
    describe:
      'db init [--driver d1|libsql|postgres]: Drizzle schema, client, config, migrations scripts',
    run: async (a) => (await import('./commands/db.ts')).db(a),
  },
  deploy: {
    describe:
      'deploy [--prod] [--target cloudflare|vercel|docker] [--force]: noindexed preview by default, production on --prod',
    run: async (a) => (await import('./commands/deploy.ts')).deploy(a),
  },
  sites: {
    describe:
      'sites: every site produced on this machine and its last deployment (~/.dss/sites.json)',
    run: async (a) => (await import('./commands/sites.ts')).sites(a),
  },
  brain: {
    describe:
      'brain init | query "<topic>" | status | log <op> <site> "<summary>": the factory memory shared by all sites',
    run: async (a) => (await import('./commands/brain.ts')).brain(a),
  },
  mcp: {
    describe:
      'mcp list | add <motionsites|60fps|context7|playwright|gbrain> | remove <name>: opt-in MCP servers in .mcp.json',
    run: async (a) => (await import('./commands/mcp.ts')).mcp(a),
  },
  aimkit: {
    describe:
      'aimkit setup | token | init: install the Chrome extension once, pair it, print the token (vendored AimKit)',
    run: async (a) => (await import('./commands/dev.ts')).aimkit(a),
  },
  upgrade: {
    describe:
      'upgrade [--core <tag>]: newer core, aligned Next/OpenNext/wrangler versions, AI layer and theme refreshed',
    run: async (a) => (await import('./commands/upgrade.ts')).upgrade(a),
  },
  factory: {
    describe:
      'factory run <briefs-dir> [--out dir] [--agent --max-turns 120]: one site per brief, optionally built by Claude headless',
    run: async (a) => (await import('./commands/factory.ts')).factory(a),
  },
  'release-core': {
    describe:
      'release-core <patch|minor|major> [--dry]: version, changelog, commit and tag (core repository)',
    run: async (a) => (await import('./commands/core.ts')).releaseCore(a),
  },
  catalog: {
    describe: 'catalog: regenerate core/CATALOG.md and _ai/digest.md (core repository)',
    run: async (a) => (await import('./commands/ai.ts')).catalog(a),
  },
  cost: {
    describe:
      'cost [--print --out file]: tokens and API-equivalent price of the site per step, model and session (site.cost.md)',
    run: async (a) => (await import('./commands/cost.ts')).cost(a),
  },
  docs: {
    describe:
      'docs: regenerate docs/cli.md, docs/llms.txt and docs/llms-full.txt (core repository)',
    run: async (a) => (await import('./commands/docs.ts')).docs(a),
  },
  'sync-ai': {
    describe: 'sync-ai: copy core/_ai into .claude/ and rebuild the routing index',
    run: async (a) => (await import('./commands/ai.ts')).syncAi(a),
  },
}
