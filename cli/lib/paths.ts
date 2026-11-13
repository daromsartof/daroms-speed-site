import { existsSync, realpathSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fail } from './log.ts'

/** Core root: the nearest ancestor of this file holding VERSION and template/ (raw TS or bundled dist). */
function findCore(from: string): string {
  let dir = from
  while (true) {
    if (existsSync(join(dir, 'VERSION')) && existsSync(join(dir, 'template'))) return dir
    const parent = dirname(dir)
    if (parent === dir) throw new Error(`dss: cannot locate the framework root from ${from}`)
    dir = parent
  }
}

export const CORE_DIR = findCore(import.meta.dirname)

/** Walks up to the folder holding site.manifest.ts. */
export function findSiteRoot(from = process.cwd()): string | undefined {
  let dir = resolve(from)
  while (true) {
    if (existsSync(join(dir, 'site.manifest.ts')) && existsSync(join(dir, 'design.dna.ts')))
      return dir
    const parent = dirname(dir)
    if (parent === dir) return undefined
    dir = parent
  }
}

export function siteRoot(): string {
  return (
    findSiteRoot() ??
    fail('no dss site here (site.manifest.ts not found): run from the site folder')
  )
}

export function isCoreRepo(dir = process.cwd()): boolean {
  return realpathSync(resolve(dir)) === realpathSync(CORE_DIR)
}

/** Brain directory (factory memory shared by all sites). */
export function brainDir(): string {
  return process.env.DSS_BRAIN ?? join(process.env.HOME ?? '.', '.dss', 'brain')
}
