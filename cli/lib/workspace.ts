import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readJson, writeFile, writeJson } from './fsx.ts'

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
  const pkg = readJson<{ dependencies?: Record<string, string> }>(pkgFile)
  const dep = `@dss/${name}`
  if (!pkg.dependencies?.[dep]) {
    pkg.dependencies = Object.fromEntries(
      Object.entries({ ...pkg.dependencies, [dep]: 'workspace:*' }).sort(),
    )
    writeJson(pkgFile, pkg)
    changed = true
  }
  return changed
}
