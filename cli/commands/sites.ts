import type { Args } from '../lib/args.ts'
import { color, log } from '../lib/log.ts'
import { readSites, registryFile } from '../lib/sites.ts'

/** dss sites: every site produced on this machine, with its last deployment. */
export async function sites(_args: Args) {
  const all = readSites()
  if (!all.length) return log.info(`no site recorded yet (${registryFile()})`)
  for (const s of all.sort((a, b) => a.created.localeCompare(b.created))) {
    const last = s.deployments.at(-1)
    const deployed = last
      ? `${last.env} ${last.target} ${last.at.slice(0, 10)}${last.url ? ` ${last.url}` : ''}`
      : 'not deployed'
    console.log(
      `${color.bold(s.slug.padEnd(22))} ${s.preset.padEnd(10)} ${s.industry.padEnd(18)} ${deployed}`,
    )
  }
  log.info(`${all.length} site(s), registry ${registryFile()}`)
}
