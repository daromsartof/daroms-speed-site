import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createRng, type ArchetypeId } from '../../packages/design/src/index.ts'
import { readJson, writeFile } from './fsx.ts'
import { fail } from './log.ts'
import { CORE_DIR } from './paths.ts'

export type SectionMeta = {
  id: string
  variant: string
  component: string
  title: string
  description: string
  fits: ArchetypeId[]
  client: boolean
  needs?: { scenes?: string[] }
  dir: string
  version: string
}

export type SceneMeta = {
  id: string
  component: string
  title: string
  description: string
  files: string[]
  dir: string
}

const SECTIONS = join(CORE_DIR, 'registry', 'sections')
const SCENES = join(CORE_DIR, 'registry', 'scenes')
const STAMP = /^\/\/ dss-section: ([\w-]+)\/([\w-]+)@([\d.]+)/

export function listSections(): SectionMeta[] {
  if (!existsSync(SECTIONS)) return []
  return readdirSync(SECTIONS).flatMap((id) =>
    readdirSync(join(SECTIONS, id)).map((variant) => {
      const dir = join(SECTIONS, id, variant)
      const meta = readJson<Omit<SectionMeta, 'dir' | 'version'>>(join(dir, 'meta.json'))
      const version = STAMP.exec(readFileSync(join(dir, 'section.tsx'), 'utf8'))?.[3] ?? '0.0.0'
      return { ...meta, dir, version }
    }),
  )
}

/**
 * "hero" or "hero/split-editorial". Without a variant, one of the variants that fit the archetype is
 * picked with the site seed, so two sites with the same archetype still differ.
 */
export function resolveSection(
  spec: string,
  archetype?: ArchetypeId,
  seed?: string,
  allowScenes = true,
): SectionMeta {
  const [id, variant] = spec.split('/') as [string, string | undefined]
  const candidates = listSections().filter((s) => s.id === id)
  if (candidates.length === 0) {
    const known = [...new Set(listSections().map((s) => s.id))].join(', ')
    fail(`unknown section "${id}". Registry: ${known}`)
  }
  if (variant)
    return candidates.find((s) => s.variant === variant) ?? fail(`unknown variant ${spec}`)
  const usable = allowScenes ? candidates : candidates.filter((s) => !s.needs?.scenes?.length)
  const fitting = archetype ? usable.filter((s) => s.fits.includes(archetype)) : []
  const pool = fitting.length ? fitting : usable.length ? usable : candidates
  if (!seed || pool.length === 1) return pool[0] as SectionMeta
  return pool[Math.floor(createRng(`${seed}:${id}`)() * pool.length)] as SectionMeta
}

export function listScenes(): SceneMeta[] {
  if (!existsSync(SCENES)) return []
  return readdirSync(SCENES).map((id) => ({
    ...readJson<Omit<SceneMeta, 'dir'>>(join(SCENES, id, 'meta.json')),
    dir: join(SCENES, id),
  }))
}

/** Copies a registry scene into components/3d/ (site-owned). Returns the files added. */
export function installScene(root: string, id: string): string[] {
  const scene =
    listScenes().find((s) => s.id === id) ??
    fail(
      `unknown scene "${id}". Registry: ${listScenes()
        .map((s) => s.id)
        .join(', ')}`,
    )
  const added: string[] = []
  for (const file of scene.files) {
    const target = join(root, 'components/3d', file)
    if (existsSync(target)) continue
    writeFile(target, readFileSync(join(scene.dir, file), 'utf8'))
    added.push(`components/3d/${file}`)
  }
  return added
}

/** Variant already installed in the site for a section id (from its stamp), so pages share one variant. */
export function installedVariant(root: string, id: string): string | undefined {
  const file = join(root, 'components/sections', `${id}.tsx`)
  if (!existsSync(file)) return undefined
  const stamp = STAMP.exec(readFileSync(file, 'utf8'))
  return stamp && stamp[1] === id ? `${id}/${stamp[2]}` : undefined
}

export type Installed = {
  file: string
  component: string
  importPath: string
  status: 'added' | 'kept'
  /** Core packages the section needs in the site workspace (pnpm install required when added). */
  packages: string[]
}

/**
 * Copies a registry section into components/sections/<id>.tsx. An existing file of the same
 * section is kept (the site owns it); a different variant under the same name needs --force.
 */
export function installSection(root: string, meta: SectionMeta, force = false): Installed {
  const rel = `components/sections/${meta.id}.tsx`
  const target = join(root, rel)
  const scenes = meta.needs?.scenes ?? []
  for (const scene of scenes) installScene(root, scene)
  const result = {
    file: rel,
    component: meta.component,
    importPath: `@/components/sections/${meta.id}`,
    packages: scenes.length ? ['three'] : [],
  }
  if (existsSync(target) && !force) {
    const stamp = STAMP.exec(readFileSync(target, 'utf8'))
    if (stamp && stamp[2] !== meta.variant) {
      fail(
        `${rel} is ${stamp[1]}/${stamp[2]}; use --force to replace it with ${meta.id}/${meta.variant}`,
      )
    }
    return { ...result, status: 'kept' }
  }
  writeFile(target, readFileSync(join(meta.dir, 'section.tsx'), 'utf8'))
  return { ...result, status: 'added' }
}

/** Placeholder copy for a section (registry example.json: data only, loadable from node_modules). */
export async function sectionExample(meta: SectionMeta): Promise<Record<string, unknown>> {
  return readJson<Record<string, unknown>>(join(meta.dir, 'example.json'))
}
