import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ArchetypeId } from '../../packages/design/src/index.ts'
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
  dir: string
  version: string
}

const SECTIONS = join(CORE_DIR, 'registry', 'sections')
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

/** "hero" or "hero/split-editorial". Without a variant, the first one that fits the archetype wins. */
export function resolveSection(spec: string, archetype?: ArchetypeId): SectionMeta {
  const [id, variant] = spec.split('/') as [string, string | undefined]
  const candidates = listSections().filter((s) => s.id === id)
  if (candidates.length === 0) {
    const known = [...new Set(listSections().map((s) => s.id))].join(', ')
    fail(`unknown section "${id}". Registry: ${known}`)
  }
  if (variant)
    return candidates.find((s) => s.variant === variant) ?? fail(`unknown variant ${spec}`)
  return (
    (archetype && candidates.find((s) => s.fits.includes(archetype))) ||
    (candidates[0] as SectionMeta)
  )
}

export type Installed = {
  file: string
  component: string
  importPath: string
  status: 'added' | 'kept'
}

/**
 * Copies a registry section into components/sections/<id>.tsx. An existing file of the same
 * section is kept (the site owns it); a different variant under the same name needs --force.
 */
export function installSection(root: string, meta: SectionMeta, force = false): Installed {
  const rel = `components/sections/${meta.id}.tsx`
  const target = join(root, rel)
  const result = {
    file: rel,
    component: meta.component,
    importPath: `@/components/sections/${meta.id}`,
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

/** Placeholder copy for a section (registry example.ts default export). */
export async function sectionExample(meta: SectionMeta): Promise<Record<string, unknown>> {
  const mod = (await import(pathToFileURL(join(meta.dir, 'example.ts')).href)) as {
    default: Record<string, unknown>
  }
  return structuredClone(mod.default)
}
