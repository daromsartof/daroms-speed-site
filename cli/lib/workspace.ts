import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readJson, writeFile, writeJson } from './fsx.ts'
import { CORE_DIR } from './paths.ts'

/**
 * Libraries that site-owned code imports directly next to a core package (pnpm is strict: a site
 * cannot import its dependencies' dependencies). Versions come from the core package itself.
 */
const SITE_LIBRARIES: Record<string, { deps: string[]; devDeps: string[] }> = {
  three: { deps: ['three', '@react-three/fiber'], devDeps: ['@types/three'] },
  data: { deps: ['drizzle-orm'], devDeps: [] },
}

function corePackageJson(name: string): {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
} {
  return readJson(join(CORE_DIR, 'packages', name, 'package.json'))
}

/**
 * Adds a core package to the site's pnpm workspace and dependencies (e.g. three, data).
 * Returns true when something changed, meaning `pnpm install` must run.
 */
export function ensureCorePackage(root: string, name: string): boolean {
  let changed = false
  const workspace = join(root, 'pnpm-workspace.yaml')
  const entry = `core/packages/${name}`
  const yaml = existsSync(workspace) ? readFileSync(workspace, 'utf8') : 'packages:\n'
  if (!yaml.split('\n').some((line) => line.trim() === `- ${entry}`)) {
    writeFile(workspace, `${yaml.replace(/\s*$/, '')}\n  - ${entry}\n`)
    changed = true
  }
  const pkgFile = join(root, 'package.json')
  const pkg = readJson<{
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }>(pkgFile)
  const wanted: Record<string, string> = { [`@dss/${name}`]: 'workspace:*' }
  const wantedDev: Record<string, string> = {}
  const libraries = SITE_LIBRARIES[name]
  if (libraries) {
    const core = corePackageJson(name)
    const versions = { ...core.dependencies, ...core.devDependencies }
    for (const lib of libraries.deps) if (versions[lib]) wanted[lib] = versions[lib]
    for (const lib of libraries.devDeps) if (versions[lib]) wantedDev[lib] = versions[lib]
  }
  const sort = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).sort())
  const missing =
    Object.keys(wanted).some((k) => !pkg.dependencies?.[k]) ||
    Object.keys(wantedDev).some((k) => !pkg.devDependencies?.[k])
  if (missing) {
    pkg.dependencies = sort({ ...pkg.dependencies, ...wanted })
    if (Object.keys(wantedDev).length)
      pkg.devDependencies = sort({ ...pkg.devDependencies, ...wantedDev })
    writeJson(pkgFile, pkg)
    changed = true
  }
  return changed
}
