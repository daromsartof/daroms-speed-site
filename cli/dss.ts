#!/usr/bin/env node
// dss: short, deterministic commands. Claude fills in only what is specific to the site.
import { parseArgs, type Args } from './lib/args.ts'
import { CliError, color, log } from './lib/log.ts'

type Command = { describe: string; run: (args: Args) => Promise<void> }

const COMMANDS: Record<string, Command> = {
  new: {
    describe:
      'new <slug> [--name --preset vitrine|landing|blank --industry --mood a,b --seed --url --target --copy|--link|--core <url>]',
    run: async (a) => (await import('./commands/new.ts')).newSite(a),
  },
  dev: {
    describe: 'dev [--port 3000 --https]: next dev',
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
      'add list | add section <id[/variant]> [--page /route --force]: copy a registry section into the site',
    run: async (a) => (await import('./commands/add.ts')).add(a),
  },
}

function help() {
  console.log(`${color.bold('dss')}: daroms-speed-site, Next.js websites built for Claude Code\n`)
  for (const [name, command] of Object.entries(COMMANDS))
    console.log(`  ${color.cyan(name.padEnd(8))} ${command.describe}`)
}

const [name, ...rest] = process.argv.slice(2)
const command = name ? COMMANDS[name] : undefined
if (!command) {
  help()
  process.exit(name && name !== 'help' && name !== '--help' ? 1 : 0)
}
try {
  await command.run(parseArgs(rest))
} catch (error) {
  if (error instanceof CliError) {
    log.fail(error.message)
    process.exit(1)
  }
  throw error
}
