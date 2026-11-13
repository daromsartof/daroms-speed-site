import { flag, type Args } from '../lib/args.ts'
import { run } from '../lib/exec.ts'
import { fail, log } from '../lib/log.ts'
import { addModule, listModules, removeModule } from '../lib/modules.ts'
import { siteRoot } from '../lib/paths.ts'
import { loadManifest } from '../lib/site.ts'

/** `--config key=value,key2=value2` into an object (numbers and booleans parsed). */
function parseConfig(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {}
  return Object.fromEntries(
    raw.split(',').map((pair) => {
      const [key, ...value] = pair.split('=')
      const text = value.join('=')
      const parsed =
        text === 'true'
          ? true
          : text === 'false'
            ? false
            : /^\d+(\.\d+)?$/.test(text)
              ? Number(text)
              : text
      return [key?.trim() ?? '', parsed]
    }),
  )
}

/** dss module list | add <slug> [--config k=v --page /route] | remove <slug> */
export async function moduleCommand(args: Args) {
  const [sub, slug] = args._
  if (sub === 'list' || !sub) {
    const installed = new Set(Object.keys((await loadManifest(siteRoot())).manifest.modules))
    for (const m of listModules())
      console.log(`${installed.has(m.slug) ? '●' : '○'} ${m.slug.padEnd(12)} ${m.description}`)
    return
  }
  const root = siteRoot()
  if (sub === 'add') {
    const install = await addModule(root, slug ?? fail('usage: dss module add <slug>'), {
      config: parseConfig(flag(args, 'config')),
      page: flag(args, 'page'),
    })
    if (install) {
      log.step('installing dependencies (pnpm install)')
      await run(['pnpm', 'install'], { cwd: root, quiet: true })
    }
    log.info('next: read core/modules/<slug>/README.md, fill .env values, replace placeholders')
    return
  }
  if (sub === 'remove') return removeModule(root, slug ?? fail('usage: dss module remove <slug>'))
  fail('usage: dss module list | add <slug> [--config k=v] [--page /route] | remove <slug>')
}
