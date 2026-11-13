import { existsSync, readFileSync, renameSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { rollDna, designRead, type Dna } from '../../packages/design/src/index.ts'
import { bool, flag, list, type Args } from '../lib/args.ts'
import { run } from '../lib/exec.ts'
import { attachCore } from '../lib/attach.ts'
import { copyDir, readJson, writeFile, writeJson } from '../lib/fsx.ts'
import { color, fail, log } from '../lib/log.ts'
import { generatePage, type PageSpec } from '../lib/pages.ts'
import { CORE_DIR } from '../lib/paths.ts'
import { addModule } from '../lib/modules.ts'
import { ensureCorePackage } from '../lib/workspace.ts'
import {
  loadDna,
  readHistory,
  recordHistory,
  saveDna,
  saveManifest,
  writeTheme,
} from '../lib/site.ts'

const TEMPLATE_SKIP =
  /^(presets|node_modules|\.next|\.open-next|\.wrangler)(\/|$)|next-env\.d\.ts$|tsbuildinfo$/

type Preset = { description: string; industry?: string; pages: PageSpec[]; modules?: string[] }

function loadPreset(name: string): Preset {
  const file = join(CORE_DIR, 'template', 'presets', name, 'preset.json')
  if (!existsSync(file)) fail(`unknown preset "${name}" (template/presets/)`)
  return readJson<Preset>(file)
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
  renameSync(join(dest, 'mcp.json'), join(dest, '.mcp.json'))
  renameSync(join(dest, 'env.example'), join(dest, '.env.example'))
  renameSync(join(dest, 'aimkit.json'), join(dest, '.aimkit.json'))
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
  // One Worker per site: the template name would make every site deploy over the same Worker.
  const wranglerFile = join(dest, 'wrangler.jsonc')
  writeFile(
    wranglerFile,
    readFileSync(wranglerFile, 'utf8').replaceAll('"dss-site"', JSON.stringify(slug)),
  )
  writeFile(
    pkgFile,
    readFileSync(pkgFile, 'utf8').replace('docker build -t dss-site', `docker build -t ${slug}`),
  )

  log.step('installing dependencies (pnpm install)')
  await run(['pnpm', 'install'], { cwd: dest, quiet: !bool(args, 'verbose') })

  const dna: Dna = rollDna({
    seed: flag(args, 'seed') ?? slug,
    industry,
    moods: list(args, 'mood'),
    history: readHistory(slug),
  })
  saveDna(dest, dna)
  writeTheme(dest, await loadDna(dest), name)
  if (!bool(args, 'no-history')) recordHistory(slug, dna)
  log.ok(designRead(dna))

  const needed = new Set<string>()
  for (const page of preset.pages) {
    for (const name of await generatePage(dest, page, dna, true)) needed.add(name)
  }
  let install = [...needed].some((name) => ensureCorePackage(dest, name))
  const modules = [...new Set([...(preset.modules ?? []), ...list(args, 'modules')])]
  for (const slug of modules) install = (await addModule(dest, slug)) || install
  if (install) {
    log.step('installing added packages (pnpm install)')
    await run(['pnpm', 'install'], { cwd: dest, quiet: !bool(args, 'verbose') })
  }

  // AI layer: .claude/ from core/_ai, then the routing index. CLAUDE_PROJECT_DIR must be the new site,
  // not a Claude Code session the CLI may run in.
  const ai = { cwd: dest, allowFailure: true, quiet: true, env: { CLAUDE_PROJECT_DIR: dest } }
  await run(['python3', join(dest, 'core/_ai/hooks/dss-sync.py'), '--force'], ai)
  await run(['python3', join(dest, '.claude/hooks/dss-context.py'), 'build'], ai)
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
