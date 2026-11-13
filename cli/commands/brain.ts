import { flag, type Args } from '../lib/args.ts'
import { appendLog, brainStatus, initBrain, queryIndex } from '../lib/brain.ts'
import { fail, log } from '../lib/log.ts'
import { brainDir } from '../lib/paths.ts'

/** dss brain init | query "<topic>" | status | log <op> <site> "<summary>" */
export async function brain(args: Args) {
  const [sub, ...rest] = args._
  const dir = flag(args, 'dir') ?? brainDir()
  if (sub === 'init') {
    const created = initBrain(dir)
    log.ok(created.length ? `brain at ${dir}: ${created.join(', ')}` : `brain already at ${dir}`)
    return
  }
  if (sub === 'query') {
    const query = rest.join(' ')
    if (!query) fail('usage: dss brain query "<industry, pattern or problem>"')
    const hits = queryIndex(query, dir)
    if (!hits.length) return log.info(`no brain page matches "${query}" (${dir}/index.md)`)
    for (const hit of hits) console.log(hit.line)
    log.info(`read at most 3 of these pages under ${dir}/`)
    return
  }
  if (sub === 'status' || !sub) {
    const s = brainStatus(dir)
    console.log(`${s.dir}: ${s.pages} page(s), ${s.indexed} indexed, ${s.sites} site DNA(s)`)
    if (s.orphans.length) log.warn(`not in index.md: ${s.orphans.join(', ')}`)
    if (s.lastLog) log.info(`last: ${s.lastLog}`)
    return
  }
  if (sub === 'log') {
    const [op, site, ...summary] = rest
    if (!op || !site || !summary.length) fail('usage: dss brain log <op> <site> "<summary>"')
    appendLog(op, site, summary.join(' '), dir)
    log.ok('logged')
    return
  }
  fail('usage: dss brain init | query "<topic>" | status | log <op> <site> "<summary>"')
}
