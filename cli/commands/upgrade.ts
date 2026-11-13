import { existsSync, lstatSync } from 'node:fs'
import { join } from 'node:path'
import { flag, type Args } from '../lib/args.ts'
import { capture, run } from '../lib/exec.ts'
import { readJson, writeJson } from '../lib/fsx.ts'
import { fail, log } from '../lib/log.ts'
import { siteRoot } from '../lib/paths.ts'
import { loadDna, loadManifest, writeTheme } from '../lib/site.ts'

type Pkg = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  packageManager?: string
}

/** Aligns the site's versions with core/template for every dependency both declare (Next, OpenNext, wrangler...). */
export function alignVersions(site: Pkg, template: Pkg): string[] {
  const changed: string[] = []
  for (const field of ['dependencies', 'devDependencies'] as const) {
    for (const [name, version] of Object.entries(template[field] ?? {})) {
      const current = site[field]?.[name]
      if (current && current !== version && !current.startsWith('workspace:')) {
        ;(site[field] as Record<string, string>)[name] = version
        changed.push(`${name} ${current} -> ${version}`)
      }
    }
  }
  if (template.packageManager && site.packageManager !== template.packageManager) {
    site.packageManager = template.packageManager
    changed.push(`packageManager -> ${template.packageManager}`)
  }
  return changed
}

/** dss upgrade [--core <tag|commit>]: newer core, aligned dependency floors, AI layer and theme refreshed. */
export async function upgrade(args: Args) {
  const root = siteRoot()
  const core = join(root, 'core')
  if (lstatSync(core).isSymbolicLink())
    log.info('core is linked: it follows the framework checkout')
  else if (existsSync(join(core, '.git'))) {
    await run(['git', '-C', core, 'fetch', '-q', '--tags', 'origin'], { allowFailure: true })
    const latest = (await capture(['git', '-C', core, 'tag', '--sort=-v:refname'])).out
      .split('\n')[0]
      ?.trim()
    const ref = flag(args, 'core') ?? latest
    if (!ref) log.warn('no release tag found on the core remote: pass --core <ref>')
    else {
      await run(['git', '-C', core, 'checkout', '-q', ref])
      log.ok(`core at ${ref}`)
    }
  } else log.warn('core is a copy: replace it with a newer copy to upgrade the framework')

  const pkgFile = join(root, 'package.json')
  const site = readJson<Pkg>(pkgFile)
  const changed = alignVersions(site, readJson<Pkg>(join(core, 'template/package.json')))
  if (changed.length) {
    writeJson(pkgFile, site)
    for (const line of changed) log.info(line)
  }
  log.step('pnpm install')
  await run(['pnpm', 'install'], { cwd: root, quiet: true })
  const env = { CLAUDE_PROJECT_DIR: root }
  await run(['python3', join(core, '_ai/hooks/dss-sync.py'), '--force'], {
    cwd: root,
    env,
    quiet: true,
    allowFailure: true,
  })
  const { manifest } = await loadManifest(root)
  writeTheme(root, await loadDna(root), manifest.name)
  const doctor = await capture(['node', join(core, 'cli/dss.ts'), 'doctor', '--quick'], {
    cwd: root,
  })
  if (doctor.code !== 0) fail(`upgraded, but doctor reports problems:\n${doctor.out.trim()}`)
  log.ok('upgrade done: review the diff, then pnpm build')
}
