import { existsSync, readFileSync, realpathSync, renameSync, symlinkSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { rollDna, designRead, type Dna } from '../../packages/design/src/index.ts'
import { bool, flag, list, type Args } from '../lib/args.ts'
import { capture, run } from '../lib/exec.ts'
import { copyDir, readJson, writeJson } from '../lib/fsx.ts'
import { color, fail, log } from '../lib/log.ts'
import { generatePage, type PageSpec } from '../lib/pages.ts'
import { CORE_DIR } from '../lib/paths.ts'
import { readHistory, recordHistory, saveDna, saveManifest, writeTheme } from '../lib/site.ts'

const DEFAULT_CORE_URL = 'https://github.com/daromsartof/daroms-speed-site.git'
const CORE_SKIP =
  /^(node_modules|\.git|\.dss|dist|coverage|test-results|docs\/dist|docs\/\.astro)(\/|$)|\/node_modules(\/|$)/
const TEMPLATE_SKIP =
  /^(presets|node_modules|\.next|\.open-next|\.wrangler)(\/|$)|next-env\.d\.ts$|tsbuildinfo$/

type Preset = { description: string; industry?: string; pages: PageSpec[] }

function loadPreset(name: string): Preset {
  const file = join(CORE_DIR, 'template', 'presets', name, 'preset.json')
  if (!existsSync(file)) fail(`unknown preset "${name}" (template/presets/)`)
  return readJson<Preset>(file)
}

async function coreIsCheckout(): Promise<boolean> {
  const { code, out } = await capture(['git', '-C', CORE_DIR, 'rev-parse', '--show-toplevel'])
  return code === 0 && realpathSync(out.trim()) === realpathSync(CORE_DIR)
}

async function attachCore(dest: string, args: Args) {
  if (bool(args, 'link')) {
    symlinkSync(CORE_DIR, join(dest, 'core'), 'dir')
    return log.ok('core linked (symlink, for framework development)')
  }
  const copy = () => copyDir(CORE_DIR, join(dest, 'core'), (rel) => CORE_SKIP.test(rel))
  if (bool(args, 'copy')) {
    copy()
    return log.ok('core copied (self-contained snapshot, for client handoff)')
  }
  const checkout = await coreIsCheckout()
  const url = flag(args, 'core') ?? (checkout ? await checkoutUrl() : DEFAULT_CORE_URL)
  const added = await run(
    ['git', '-c', 'protocol.file.allow=always', 'submodule', 'add', '-q', url, 'core'],
    {
      cwd: dest,
      allowFailure: true,
      quiet: true,
      env: { GIT_TERMINAL_PROMPT: '0' },
    },
  )
  if (added !== 0) {
    log.warn(
      `${url} unreachable: copying the installed core instead (pass --core <url> for a submodule)`,
    )
    copy()
    return
  }
  const tag = `v${readFileSync(join(CORE_DIR, 'VERSION'), 'utf8').trim()}`
  if (checkout) {
    // From a working copy: pin the submodule to the exact commit that created the site.
    const { out } = await capture(['git', '-C', CORE_DIR, 'rev-parse', 'HEAD'])
    await run(['git', '-C', 'core', 'checkout', '-q', out.trim()], {
      cwd: dest,
      allowFailure: true,
      quiet: true,
    })
    return log.ok(`core added as a submodule (${url}, ${out.trim().slice(0, 7)})`)
  }
  const pinned = await run(['git', '-C', 'core', 'checkout', '-q', tag], {
    cwd: dest,
    allowFailure: true,
    quiet: true,
  })
  log.ok(
    pinned === 0
      ? `core submodule pinned to ${tag}`
      : `core submodule on default branch (${tag} not found)`,
  )
}

/** The origin remote when it already has HEAD; otherwise the local checkout (unpushed core work). */
async function checkoutUrl(): Promise<string> {
  const origin = await capture(['git', '-C', CORE_DIR, 'remote', 'get-url', 'origin'])
  const pushed = await capture(['git', '-C', CORE_DIR, 'branch', '-r', '--contains', 'HEAD'])
  if (origin.code === 0 && pushed.code === 0 && pushed.out.trim()) return origin.out.trim()
  log.warn(
    'core HEAD is not pushed: the submodule points to the local checkout (pass --core <url> before sharing)',
  )
  return CORE_DIR
}

/** dss new <slug>: a complete site, installed, themed from a fresh DNA, pages generated from a preset. */
export async function newSite(args: Args) {
  const slug =
    args._[0] ??
    fail('usage: dss new <slug> [--name "Name"] [--preset vitrine] [--industry ...] [--mood a,b]')
  if (!/^[a-z][a-z0-9-]*$/.test(slug)) fail('slug: lowercase letters, digits and dashes')
  const dest = resolve(flag(args, 'dir') ?? process.cwd(), slug)
  if (existsSync(dest)) fail(`folder already exists: ${dest}`)
  const name =
    flag(args, 'name') ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const presetName = flag(args, 'preset') ?? 'vitrine'
  const preset = loadPreset(presetName)
  const industry = flag(args, 'industry') ?? preset.industry ?? 'general'

  log.step(`creating ${color.bold(name)} (${presetName}) in ${dest}`)
  copyDir(join(CORE_DIR, 'template'), dest, (rel) => TEMPLATE_SKIP.test(rel))
  renameSync(join(dest, 'gitignore'), join(dest, '.gitignore'))
  renameSync(join(dest, 'npmrc'), join(dest, '.npmrc'))
  const git = !bool(args, 'no-git')
  if (git) await run(['git', 'init', '-q', '-b', 'main'], { cwd: dest })
  await attachCore(dest, args)

  saveManifest(dest, {
    name,
    url: flag(args, 'url') ?? `https://${slug}.example`,
    locale: flag(args, 'locale') ?? 'en',
    industry,
    deploy: {
      target:
        (flag(args, 'target') as 'cloudflare' | 'vercel' | 'docker' | undefined) ?? 'cloudflare',
    },
    pages: [{ route: '/', name: 'home' }],
  })
  const pkgFile = join(dest, 'package.json')
  const pkg = readJson<Record<string, unknown>>(pkgFile)
  writeJson(pkgFile, { ...pkg, name: slug })

  log.step('installing dependencies (pnpm install)')
  await run(['pnpm', 'install'], { cwd: dest, quiet: !bool(args, 'verbose') })

  const dna: Dna = rollDna({
    seed: flag(args, 'seed') ?? slug,
    industry,
    moods: list(args, 'mood'),
    history: readHistory(slug),
  })
  saveDna(dest, dna)
  writeTheme(dest, dna, name)
  if (!bool(args, 'no-history')) recordHistory(slug, dna)
  log.ok(designRead(dna))

  for (const page of preset.pages) await generatePage(dest, page, dna.archetype, true)

  if (existsSync(join(CORE_DIR, '_ai', 'hooks', 'dss-sync.py'))) {
    await run(['python3', join(dest, 'core/_ai/hooks/dss-sync.py'), '--force'], {
      cwd: dest,
      allowFailure: true,
      quiet: true,
    })
  }
  if (git) {
    await run(['git', 'add', '-A'], { cwd: dest, quiet: true })
    await run(
      ['git', 'commit', '-q', '-m', `chore: create ${name} (dss new --preset ${presetName})`],
      {
        cwd: dest,
        allowFailure: true,
        quiet: true,
      },
    )
  }
  log.ok(`${name} is ready`)
  console.log(
    `\n  cd ${basename(dest)}\n  pnpm dev          ${color.dim('# http://localhost:3000')}\n  pnpm dss doctor   ${color.dim('# placeholders left, theme, types')}\n`,
  )
}
