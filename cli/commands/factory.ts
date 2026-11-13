import { appendFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { bool, flag, type Args } from '../lib/args.ts'
import { capture, run } from '../lib/exec.ts'
import { fail, log } from '../lib/log.ts'
import { brainDir, CORE_DIR } from '../lib/paths.ts'

export type Brief = {
  slug: string
  name?: string
  preset?: string
  industry?: string
  mood?: string
  url?: string
  modules?: string
  body: string
}

/** A brief file: `key: value` front matter (slug falls back to the file name) and the site.spec.md body. */
export function parseBrief(text: string, fallbackSlug: string): Brief {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text)
  const meta: Record<string, string> = {}
  for (const line of (match?.[1] ?? '').split('\n')) {
    const [key, ...rest] = line.split(':')
    if (key && rest.length) meta[key.trim()] = rest.join(':').trim()
  }
  return { ...meta, slug: meta.slug ?? fallbackSlug, body: (match?.[2] ?? text).trim() } as Brief
}

type AgentResult = { cost?: number; turns?: number; result?: string; failed?: boolean }

type AgentJson = {
  total_cost_usd?: number
  num_turns?: number
  result?: string
  is_error?: boolean
  subtype?: string
}

/** A headless run that stopped early: an error, max turns, or a usage limit (reported as a plain result). */
export function agentFailed(json: AgentJson): boolean {
  return (
    json.is_error === true ||
    (json.subtype ?? '').startsWith('error') ||
    /\b(?:hit your|reached your) .*limit\b/i.test(json.result ?? '')
  )
}

/**
 * The headless Claude command for one site. A fresh folder is not a trusted workspace, so Claude ignores the
 * project's `permissions.allow`: the same rules are passed on the command line, with the brain as an extra dir.
 * WebFetch is added for any domain: /dss-research opens competitor sites and nobody is there to approve each one.
 */
export function agentCommand(site: string, name: string, maxTurns: string): string[] {
  const settings = [join(site, '.claude/settings.json'), join(site, 'core/_ai/settings.json')].find(
    (f) => existsSync(f),
  )
  const allow = settings
    ? ((JSON.parse(readFileSync(settings, 'utf8')) as { permissions?: { allow?: string[] } })
        .permissions?.allow ?? [])
    : []
  const tools = [...new Set([...allow, 'WebFetch'])]
  return [
    'claude',
    '-p',
    `/dss-site --auto ${name}`,
    '--permission-mode',
    'acceptEdits',
    '--max-turns',
    maxTurns,
    '--output-format',
    'json',
    ...(existsSync(brainDir()) ? ['--add-dir', brainDir()] : []),
    `--allowedTools=${tools.join(',')}`,
  ]
}

async function runAgent(site: string, name: string, maxTurns: string): Promise<AgentResult> {
  const result = await capture(agentCommand(site, name, maxTurns), {
    cwd: site,
    env: { CLAUDE_PROJECT_DIR: site },
  })
  const json = result.out
    .split('\n')
    .reverse()
    .find((l) => l.startsWith('{'))
  if (!json) return { result: result.out.slice(-500), failed: true }
  const parsed = JSON.parse(json) as AgentJson
  return {
    cost: parsed.total_cost_usd,
    turns: parsed.num_turns,
    result: parsed.result?.slice(0, 500),
    failed: agentFailed(parsed),
  }
}

/**
 * dss factory run <briefs-dir> [--out dir] [--agent] [--max-turns 120]
 * One site per brief (the DNA history keeps them distinct); with --agent, `/dss-site --auto` runs headless in each.
 */
export async function factory(args: Args) {
  const [sub, dirArg] = args._
  if (sub !== 'run' || !dirArg) {
    fail('usage: dss factory run <briefs-dir> [--out dir] [--agent] [--max-turns 120]')
  }
  const dir = resolve(dirArg)
  const out = resolve(flag(args, 'out') ?? process.cwd())
  const briefs = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
  if (!briefs.length) fail(`no .md brief in ${dir}`)
  const logFile = join(out, 'factory.log.jsonl')
  for (const file of briefs) {
    const brief = parseBrief(readFileSync(join(dir, file), 'utf8'), file.replace(/\.md$/, ''))
    const site = join(out, brief.slug)
    const started = Date.now()
    if (existsSync(site)) {
      log.warn(`${brief.slug}: folder exists, skipped`)
      continue
    }
    log.step(`${brief.slug}: dss new`)
    const flags = ['--preset', brief.preset ?? 'vitrine', '--industry', brief.industry ?? 'general']
    if (brief.name) flags.push('--name', brief.name)
    if (brief.mood) flags.push('--mood', brief.mood)
    if (brief.url) flags.push('--url', brief.url)
    if (brief.modules) flags.push('--modules', brief.modules)
    const cli = join(CORE_DIR, 'cli/dss.ts')
    const created = await run(['node', cli, 'new', brief.slug, '--dir', out, ...flags], {
      allowFailure: true,
    })
    if (created !== 0) {
      appendFileSync(logFile, `${JSON.stringify({ slug: brief.slug, status: 'new-failed' })}\n`)
      continue
    }
    writeFileSync(join(site, 'site.spec.md'), `${brief.body}\n`)
    const agent = bool(args, 'agent')
      ? await runAgent(site, brief.name ?? brief.slug, flag(args, 'max-turns') ?? '120')
      : {}
    const seconds = Math.round((Date.now() - started) / 1000)
    const { failed, ...details } = agent as AgentResult
    const status = failed ? 'agent-stopped' : 'ok'
    appendFileSync(
      logFile,
      `${JSON.stringify({ slug: brief.slug, status, seconds, ...details })}\n`,
    )
    const cost = details.cost !== undefined ? ` ($${details.cost.toFixed(2)})` : ''
    if (failed) {
      log.warn(`${brief.slug}: agent stopped early${cost}: ${details.result ?? 'no result'}`)
      log.warn(
        `resume in ${site}: claude -p "/dss-site --auto ${brief.name ?? brief.slug}. Resume from the Journal."`,
      )
    } else log.ok(`${brief.slug} ready${cost}`)
  }
  log.info(`log: ${logFile}`)
}
