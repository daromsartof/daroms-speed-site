import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Args } from '../lib/args.ts'
import { readJson, writeJson } from '../lib/fsx.ts'
import { color, fail, log } from '../lib/log.ts'
import { siteRoot } from '../lib/paths.ts'

type ServerConfig = { type?: 'http'; url?: string; command?: string; args?: string[] }
type Recipe = { description: string; config: ServerConfig; setup: string }

/**
 * Opt-in MCP servers with verified endpoints. Every server adds tool definitions to Claude's context,
 * so sites only get aimkit and next-devtools by default.
 */
export const MCP_RECIPES: Record<string, Recipe> = {
  motionsites: {
    description:
      'MotionSites: 500+ website design prompts as inspiration (free account: 3 prompts).',
    config: { type: 'http', url: 'https://motionsites.ai/api/mcp' },
    setup:
      'Start Claude Code, run /mcp, choose motionsites, Authenticate (OAuth). Distil a chosen prompt into the DNA, never paste it raw.',
  },
  '60fps': {
    description:
      '60fps.design: iOS interaction library with motion breakdowns (paid licence; iOS/SwiftUI only, translate timings to web).',
    config: { type: 'http', url: 'https://mcp.60fps.design/mcp' },
    setup:
      'Run /mcp, choose 60fps, Authenticate and paste your licence key. Use breakdowns (timing, easing) as references only.',
  },
  context7: {
    description: 'Context7: up-to-date library documentation on demand.',
    config: { command: 'npx', args: ['-y', '@upstash/context7-mcp@4.7.0'] },
    setup:
      'No account needed for basic use. Prefer node_modules/next/dist/docs for Next.js itself.',
  },
  playwright: {
    description:
      'Playwright MCP: drive a real browser (heavier on tokens than pnpm build + captures).',
    config: { command: 'npx', args: ['-y', '@playwright/mcp@0.0.85'] },
    setup:
      'Downloads a browser on first use. Use for flows that captures cannot check (forms, menus).',
  },
  gbrain: {
    description: 'gbrain: an existing personal knowledge brain (stdio, verbs surface).',
    config: { command: 'gbrain', args: ['serve'] },
    setup:
      'Requires gbrain installed (bun install -g github:garrytan/gbrain#stable) and initialised.',
  },
}

type McpFile = { mcpServers: Record<string, ServerConfig> }

function readMcp(root: string): McpFile {
  const file = join(root, '.mcp.json')
  return existsSync(file) ? readJson<McpFile>(file) : { mcpServers: {} }
}

/** dss mcp list | add <name> | remove <name> */
export async function mcp(args: Args) {
  const [sub, name] = args._
  const root = siteRoot()
  const current = readMcp(root)
  if (sub === 'list' || !sub) {
    for (const [key, server] of Object.entries(current.mcpServers))
      console.log(
        `${color.green('●')} ${key.padEnd(14)} ${server.url ?? [server.command, ...(server.args ?? [])].join(' ')}`,
      )
    for (const [key, recipe] of Object.entries(MCP_RECIPES)) {
      if (!current.mcpServers[key]) console.log(`○ ${key.padEnd(14)} ${recipe.description}`)
    }
    return
  }
  const recipe = name ? MCP_RECIPES[name] : undefined
  if (sub === 'add') {
    if (!name || !recipe) fail(`usage: dss mcp add <${Object.keys(MCP_RECIPES).join('|')}>`)
    current.mcpServers[name] = recipe.config
    writeJson(join(root, '.mcp.json'), current)
    log.ok(`${name} added to .mcp.json`)
    log.info(recipe.setup)
    return
  }
  if (sub === 'remove') {
    if (!name || !current.mcpServers[name]) fail(`no MCP server "${name ?? ''}" in .mcp.json`)
    delete current.mcpServers[name]
    writeJson(join(root, '.mcp.json'), current)
    log.ok(`${name} removed from .mcp.json`)
    return
  }
  fail('usage: dss mcp list | add <name> | remove <name>')
}
