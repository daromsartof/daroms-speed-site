#!/usr/bin/env node
// dss: short, deterministic commands. Claude fills in only what is specific to the site.
import { COMMANDS } from './commands.ts'
import { parseArgs } from './lib/args.ts'
import { CliError, color, log } from './lib/log.ts'

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
