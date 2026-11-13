import { bool, flag, type Args } from '../lib/args.ts'
import { appendSection } from '../lib/codegen.ts'
import { camel } from '../lib/fsx.ts'
import { fail, log } from '../lib/log.ts'
import { siteRoot } from '../lib/paths.ts'
import { installSection, listSections, resolveSection, sectionExample } from '../lib/registry.ts'
import { loadDna, loadManifest, saveManifest } from '../lib/site.ts'

/** dss add section <id[/variant]> [--page /route] | dss add list */
export async function add(args: Args) {
  const [kind, spec] = args._
  if (kind === 'list' || (kind === 'section' && !spec)) {
    for (const s of listSections())
      console.log(`${`${s.id}/${s.variant}`.padEnd(30)} ${s.description}`)
    return
  }
  if (kind !== 'section') fail('usage: dss add section <id[/variant]> [--page /route] [--force]')
  const root = siteRoot()
  const dna = await loadDna(root)
  const meta = resolveSection(spec as string, dna.archetype)
  const installed = installSection(root, meta, bool(args, 'force'))
  log.ok(
    `${meta.id}/${meta.variant} ${installed.status === 'added' ? '->' : 'already in'} ${installed.file}`,
  )
  const route = flag(args, 'page')
  if (!route) return
  const { manifest, input } = await loadManifest(root)
  const page =
    manifest.pages.find((p) => p.route === route) ?? fail(`no page ${route} in site.manifest.ts`)
  const count = page.sections.filter((s) => s.split('/')[0] === meta.id).length
  const key = count === 0 ? camel(meta.id) : `${camel(meta.id)}${count + 1}`
  const ok = appendSection(
    root,
    route,
    page.name,
    { ...installed, key },
    await sectionExample(meta),
  )
  if (!ok)
    return log.warn(`page ${route} was reshaped by hand: add <${installed.component} /> yourself`)
  const target = input.pages?.find((p) => p.route === route)
  if (target) target.sections = [...(target.sections ?? []), meta.id]
  saveManifest(root, input)
  log.ok(`added to ${route} (content key "${key}")`)
}
