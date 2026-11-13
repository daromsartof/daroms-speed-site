// Cost report of a site: tokens and price (Anthropic API rates) per step, model and session.
import { existsSync, readFileSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'
import { bool, flag, type Args } from '../lib/args.ts'
import { duration, money, renderReport, summarize, tokens } from '../lib/cost-report.ts'
import { capture } from '../lib/exec.ts'
import { writeFile } from '../lib/fsx.ts'
import { color, fail, log } from '../lib/log.ts'
import { findSiteRoot } from '../lib/paths.ts'
import { findSessions, projectsDir } from '../lib/transcripts.ts'

function siteName(root: string): string {
  const manifest = join(root, 'site.manifest.ts')
  const name = existsSync(manifest)
    ? /\bname:\s*'((?:[^'\\]|\\.)+)'/.exec(readFileSync(manifest, 'utf8'))?.[1]
    : undefined
  return name?.replace(/\\'/g, "'") ?? basename(root)
}

/** First commit date: an older transcript cannot concern this site. */
async function createdAt(root: string): Promise<number | undefined> {
  const out = await capture(['git', '-C', root, 'log', '--reverse', '--format=%ct'])
  const first = Number(out.out.split('\n')[0])
  return out.code === 0 && first ? first * 1000 : undefined
}

/** dss cost [--print] [--out file] [--projects dir] */
export async function cost(args: Args) {
  const site = findSiteRoot()
  const root = site ?? process.cwd()
  const projects = flag(args, 'projects') ?? projectsDir()
  const sessions = findSessions(root, { projects, since: await createdAt(root) })
  const summary = summarize(sessions)
  if (!summary.total.turns) fail(`no Claude answer found for ${root} in ${projects}`)
  const t = summary.total
  const seconds = summary.sessions.reduce((sum, s) => sum + s.seconds, 0)
  const name = site ? siteName(root) : basename(root)
  log.step(
    `${color.bold(name)}: ${color.bold(money(t.cost))} (${tokens(t.input + t.output + t.read + t.write)} tokens, ${t.turns} answers, ${summary.sessions.length} session(s), ${duration(seconds)})`,
  )
  for (const [step, x] of summary.steps) {
    console.log(
      `  ${step.padEnd(22)} ${money(x.cost).padStart(11)}  ${String(Math.round((x.cost / t.cost) * 100) || 0).padStart(3)}%`,
    )
  }
  for (const model of summary.unknownModels) log.warn(`${model}: unknown price, counted $0`)
  const out = flag(args, 'out') ?? (site ? 'site.cost.md' : undefined)
  if (bool(args, 'print') || !out) return
  const path = resolve(root, out)
  writeFile(path, renderReport(name, summary))
  log.ok(
    `${relative(process.cwd(), path) || out} written (API-equivalent price; Pro/Max subscriptions are not billed this way)`,
  )
}
