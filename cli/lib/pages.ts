import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Dna } from '../../packages/design/src/index.ts'
import {
  contentFile,
  pageFile,
  renderContent,
  renderPage,
  sectionKeys,
  setNavLabel,
  writeMetaIndex,
  type PageSection,
} from './codegen.ts'
import { writeFile } from './fsx.ts'
import { fail, log } from './log.ts'
import { installedVariant, installSection, resolveSection, sectionExample } from './registry.ts'
import { loadManifest, saveManifest } from './site.ts'

export type PageSpec = {
  route: string
  name: string
  label?: string
  sections: readonly string[]
  nav?: boolean
}

const PAGE_META = {
  title: '[Page title: 50-60 characters, main keyword first]',
  description: '[Meta description: 140-160 characters, the page’s promise and one proof.]',
}

/**
 * Generates a page from registry sections: installs missing section components, writes the
 * content file with placeholder copy and the thin page file, then records the page in the manifest.
 */
export async function generatePage(
  root: string,
  spec: PageSpec,
  dna: Pick<Dna, 'archetype' | 'seed' | 'three'>,
  force = false,
): Promise<string[]> {
  if (!/^\/[a-z0-9/-]*$/.test(spec.route))
    fail(`route "${spec.route}": lowercase, digits, dashes, starting with /`)
  const page = join(root, pageFile(spec.route))
  const content = join(root, contentFile(spec.name))
  if (!force && (existsSync(page) || existsSync(content))) {
    fail(`${pageFile(spec.route)} or ${contentFile(spec.name)} exists (use --force to overwrite)`)
  }
  const keys = sectionKeys(spec.sections)
  const parts: PageSection[] = []
  const blocks: { key: string; value: unknown }[] = []
  const packages: string[] = []
  for (const [i, sectionSpec] of spec.sections.entries()) {
    const id = sectionSpec.split('/')[0] as string
    const chosen = sectionSpec.includes('/')
      ? sectionSpec
      : (installedVariant(root, id) ?? sectionSpec)
    const meta = resolveSection(chosen, dna.archetype, dna.seed, dna.three !== 'none')
    const installed = installSection(root, meta)
    packages.push(...installed.packages)
    if (installed.status === 'added')
      log.ok(`section ${meta.id}/${meta.variant} -> ${installed.file}`)
    const key = keys[i] as string
    parts.push({ component: installed.component, importPath: installed.importPath, key })
    blocks.push({ key, value: await sectionExample(meta) })
  }
  writeFile(content, renderContent(spec.name, PAGE_META, blocks))
  writeFile(page, renderPage(spec.route, spec.name, parts))

  const { input } = await loadManifest(root)
  const entry = {
    route: spec.route,
    name: spec.name,
    sections: [...spec.sections],
    ...(spec.nav === false ? { nav: false } : {}),
  }
  const pages = (input.pages ?? []).filter((p) => p.route !== spec.route)
  input.pages = spec.route === '/' ? [entry, ...pages] : [...pages, entry]
  saveManifest(root, input)
  setNavLabel(
    root,
    spec.route,
    spec.label ?? spec.name.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
  )
  writeMetaIndex(root, input.pages)
  log.ok(`page ${spec.route} -> ${pageFile(spec.route)} + ${contentFile(spec.name)}`)
  return [...new Set(packages)]
}
