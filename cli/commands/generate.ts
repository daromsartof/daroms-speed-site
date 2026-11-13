import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { flag, list, bool, type Args } from '../lib/args.ts'
import { appendSection } from '../lib/codegen.ts'
import { camel, kebab, pascal, render, writeFile } from '../lib/fsx.ts'
import { fail, log } from '../lib/log.ts'
import { generatePage } from '../lib/pages.ts'
import { CORE_DIR, siteRoot } from '../lib/paths.ts'
import { loadDna, loadManifest } from '../lib/site.ts'

/** dss g page|section */
export async function generate(args: Args) {
  const [kind, target] = args._
  const root = siteRoot()
  if (kind === 'page') {
    const route =
      target ?? fail('usage: dss g page <route> [--name --label --sections hero,faq,cta --no-nav]')
    const name =
      flag(args, 'name') ??
      (route === '/' ? 'home' : kebab(route.split('/').filter(Boolean).join('-')))
    const sections = list(args, 'sections')
    const dna = await loadDna(root)
    await generatePage(
      root,
      {
        route,
        name,
        label: flag(args, 'label'),
        sections: sections.length ? sections : ['hero', 'cta'],
        nav: !bool(args, 'no-nav'),
      },
      dna.archetype,
      bool(args, 'force'),
    )
    return
  }
  if (kind === 'section') {
    const name = kebab(target ?? fail('usage: dss g section <name> [--page /route]'))
    const file = join(root, 'components/sections', `${name}.tsx`)
    if (existsSync(file) && !bool(args, 'force')) fail(`components/sections/${name}.tsx exists`)
    const template = readFileSync(join(CORE_DIR, 'generators/section/files/section.tsx'), 'utf8')
    writeFile(file, render(template, { name, Name: pascal(name) }))
    log.ok(`bespoke section -> components/sections/${name}.tsx`)
    const route = flag(args, 'page')
    if (route) {
      const { manifest } = await loadManifest(root)
      const page =
        manifest.pages.find((p) => p.route === route) ??
        fail(`no page ${route} in site.manifest.ts`)
      const value = { title: `[${pascal(name)} title]`, body: `[${pascal(name)} body]` }
      const section = {
        component: pascal(name),
        importPath: `@/components/sections/${name}`,
        key: camel(name),
      }
      if (!appendSection(root, route, page.name, section, value))
        log.warn(`add <${pascal(name)} /> to ${route} by hand`)
      else log.ok(`added to ${route}`)
    }
    return
  }
  fail('usage: dss g page <route> | dss g section <name>')
}
