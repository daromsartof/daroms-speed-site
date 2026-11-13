import { existsSync, readdirSync, readFileSync, rmdirSync, rmSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { appendSection, setNavLabel, writeMetaIndex } from './codegen.ts'
import { readJson, walk, writeFile, writeJson } from './fsx.ts'
import { fail, log } from './log.ts'
import { CORE_DIR } from './paths.ts'
import { loadManifest, saveManifest } from './site.ts'
import { writeModuleSlots } from './module-slots.ts'
import { ensureCorePackage } from './workspace.ts'

export type Hook = { import: string; from: string }

export type ModuleSpec = {
  slug: string
  title: string
  description: string
  requires?: string[]
  /** Core packages added to the site workspace. */
  packages?: string[]
  /** npm dependencies added to the site (exact versions). */
  dependencies?: Record<string, string>
  /** Environment variables documented in .env.example. */
  env?: { name: string; description: string; example?: string }[]
  /** CSP presets enabled in the manifest. */
  csp?: string[]
  /** Default `manifest.modules[slug]` config. */
  config?: Record<string, unknown>
  /** Pages registered in the manifest (their files come from files/). */
  pages?: {
    route: string
    name: string
    label?: string
    nav?: boolean
    footer?: boolean
    sections?: string[]
  }[]
  /** CSP presets chosen by a config value, e.g. analytics provider. */
  cspFrom?: { key: string; map: Record<string, string[]> }
  /** A section appended to an existing page (default page in `page`). */
  section?: {
    component: string
    importPath: string
    key: string
    page: string
    example: Record<string, unknown>
  }
  /** Generated slots this module plugs into. */
  hooks?: { sitemap?: Hook; llms?: Hook; bodyEnd?: Hook }
  dir: string
}

const MODULES = join(CORE_DIR, 'modules')

export function listModules(): ModuleSpec[] {
  if (!existsSync(MODULES)) return []
  return readdirSync(MODULES)
    .filter((slug) => existsSync(join(MODULES, slug, 'module.json')))
    .map((slug) => ({
      ...readJson<Omit<ModuleSpec, 'slug' | 'dir'>>(join(MODULES, slug, 'module.json')),
      slug,
      dir: join(MODULES, slug),
    }))
}

export function getModule(slug: string): ModuleSpec {
  return (
    listModules().find((m) => m.slug === slug) ??
    fail(
      `unknown module "${slug}". Available: ${listModules()
        .map((m) => m.slug)
        .join(', ')}`,
    )
  )
}

/** Files a module copies into the site: modules/<slug>/files/<path> -> <site>/<path>. */
function moduleFiles(spec: ModuleSpec): string[] {
  const base = join(spec.dir, 'files')
  return walk(base).map((f) => relative(base, f))
}

function appendEnv(root: string, spec: ModuleSpec) {
  if (!spec.env?.length) return
  const file = join(root, '.env.example')
  const current = existsSync(file) ? readFileSync(file, 'utf8') : ''
  const missing = spec.env.filter((e) => !new RegExp(`^${e.name}=`, 'm').test(current))
  if (!missing.length) return
  const block = [
    `# ${spec.slug}: ${spec.title}`,
    ...missing.map((e) => `# ${e.description}\n${e.name}=${e.example ?? ''}`),
  ].join('\n')
  writeFile(file, `${current.replace(/\s*$/, '')}${current.trim() ? '\n\n' : ''}${block}\n`)
}

function addDependencies(root: string, deps: Record<string, string> | undefined): boolean {
  if (!deps || !Object.keys(deps).length) return false
  const file = join(root, 'package.json')
  const pkg = readJson<{ dependencies?: Record<string, string> }>(file)
  const missing = Object.entries(deps).filter(([name]) => !pkg.dependencies?.[name])
  if (!missing.length) return false
  pkg.dependencies = Object.fromEntries(
    Object.entries({ ...pkg.dependencies, ...Object.fromEntries(missing) }).sort(),
  )
  writeJson(file, pkg)
  return true
}

/** CSP presets a module needs for a given config (fixed list plus config-dependent ones). */
export function modulePresets(spec: ModuleSpec, config: Record<string, unknown>): string[] {
  const chosen = spec.cspFrom
    ? (spec.cspFrom.map[String(config[spec.cspFrom.key] ?? '')] ?? [])
    : []
  return [...new Set([...(spec.csp ?? []), ...chosen])]
}

export type AddOptions = { config?: Record<string, unknown>; page?: string }

/** Installs a module (and what it requires). Returns true when `pnpm install` is needed. */
export async function addModule(
  root: string,
  slug: string,
  options: AddOptions = {},
): Promise<boolean> {
  const spec = getModule(slug)
  let install = false
  const { input: before } = await loadManifest(root)
  if (before.modules?.[slug]) {
    log.info(`module ${slug} already installed`)
    return false
  }
  for (const required of spec.requires ?? []) install = (await addModule(root, required)) || install
  for (const name of spec.packages ?? []) install = ensureCorePackage(root, name) || install
  install = addDependencies(root, spec.dependencies) || install
  for (const rel of moduleFiles(spec)) {
    const target = join(root, rel)
    if (existsSync(target)) {
      log.warn(`${rel} exists: kept (compare with core/modules/${slug}/files/${rel})`)
      continue
    }
    writeFile(target, readFileSync(join(spec.dir, 'files', rel), 'utf8'))
  }
  appendEnv(root, spec)

  const { input } = await loadManifest(root)
  const config = { ...spec.config, ...options.config }
  input.modules = { ...input.modules, [slug]: config }
  const presets = modulePresets(spec, config)
  if (presets.length) {
    const csp = { ...input.security?.csp }
    csp.presets = [...new Set([...(csp.presets ?? []), ...presets])]
    input.security = { ...input.security, csp }
  }
  for (const { label: _label, ...page } of spec.pages ?? []) {
    if (input.pages?.some((p) => p.route === page.route)) continue
    input.pages = [...(input.pages ?? []), { sections: [], ...page }]
  }
  saveManifest(root, input)
  for (const page of spec.pages ?? []) if (page.label) setNavLabel(root, page.route, page.label)

  if (spec.section) {
    const route = options.page ?? spec.section.page
    const page = (await loadManifest(root)).manifest.pages.find((p) => p.route === route)
    const appended = page
      ? appendSection(root, route, page.name, spec.section, spec.section.example)
      : false
    if (appended) log.ok(`${spec.section.component} added to ${route}`)
    else log.warn(`add <${spec.section.component} /> to a page by hand (no page ${route})`)
  }
  const { manifest } = await loadManifest(root)
  writeMetaIndex(root, manifest.pages)
  writeModuleSlots(root, Object.keys(manifest.modules).map(getModule))
  log.ok(`module ${slug}: ${spec.title}`)
  return install
}

/** Deletes now-empty folders left by removed module files, up to (not including) the site root. */
function removeEmptyParents(root: string, dir: string) {
  let current = dir
  while (
    current.startsWith(root) &&
    current !== root &&
    existsSync(current) &&
    readdirSync(current).length === 0
  ) {
    rmdirSync(current)
    current = dirname(current)
  }
}

/** Removes a module: unmodified copied files, manifest entries, CSP presets no other module needs, slots. */
export async function removeModule(root: string, slug: string) {
  const spec = getModule(slug)
  const { input } = await loadManifest(root)
  if (!input.modules?.[slug]) fail(`module ${slug} is not installed`)
  const others = Object.keys(input.modules).filter((s) => s !== slug)
  const dependents = others.filter((s) => getModule(s).requires?.includes(slug))
  if (dependents.length) fail(`module ${slug} is required by ${dependents.join(', ')}`)
  for (const rel of moduleFiles(spec)) {
    const target = join(root, rel)
    if (!existsSync(target)) continue
    if (readFileSync(target, 'utf8') === readFileSync(join(spec.dir, 'files', rel), 'utf8')) {
      rmSync(target)
      removeEmptyParents(root, dirname(target))
    } else log.warn(`${rel} was modified: kept`)
  }
  if (spec.section) {
    for (const page of input.pages ?? []) {
      const file = join(root, page.route === '/' ? 'app/page.tsx' : `app${page.route}/page.tsx`)
      if (!existsSync(file)) continue
      const text = readFileSync(file, 'utf8')
      const next = text
        .split('\n')
        .filter(
          (l) =>
            !l.includes(`<${spec.section?.component} `) &&
            !l.includes(`import { ${spec.section?.component} } from '${spec.section?.importPath}'`),
        )
        .join('\n')
      if (next !== text) writeFile(file, next)
    }
  }
  const { [slug]: _removed, ...rest } = input.modules
  const keep = new Set(
    others.flatMap((s) => modulePresets(getModule(s), (rest[s] ?? {}) as Record<string, unknown>)),
  )
  const mine = modulePresets(spec, (input.modules[slug] ?? {}) as Record<string, unknown>)
  if (mine.length && input.security?.csp?.presets) {
    input.security.csp.presets = input.security.csp.presets.filter(
      (p) => keep.has(p) || !mine.includes(p),
    )
  }
  input.modules = rest
  const routes = new Set((spec.pages ?? []).map((p) => p.route))
  input.pages = (input.pages ?? []).filter((p) => !routes.has(p.route))
  saveManifest(root, input)
  const { manifest } = await loadManifest(root)
  writeMetaIndex(root, manifest.pages)
  writeModuleSlots(root, Object.keys(manifest.modules).map(getModule))
  log.ok(`module ${slug} removed (npm dependencies and .env.example lines are kept)`)
}
