// Type-checks and lints every registry section and scene inside a real site (sections only compile
// in a site: they import @/ paths and site packages). Usage: node scripts/verify-registry.mjs <site-dir>
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'

const core = resolve(import.meta.dirname, '..')
const site = resolve(process.argv[2] ?? '')
if (!existsSync(join(site, 'site.manifest.ts'))) {
  console.error(
    'usage: node scripts/verify-registry.mjs <site-dir> (a dss site with @dss/three installed)',
  )
  process.exit(2)
}
const target = join(site, 'components/sections/__registry__')
const scenes = join(site, 'components/3d')
rmSync(target, { recursive: true, force: true })
mkdirSync(target, { recursive: true })
mkdirSync(scenes, { recursive: true })
const copied = []
for (const id of readdirSync(join(core, 'registry/sections'))) {
  for (const variant of readdirSync(join(core, 'registry/sections', id))) {
    const file = join(target, `${id}-${variant}.tsx`)
    writeFileSync(
      file,
      readFileSync(join(core, 'registry/sections', id, variant, 'section.tsx'), 'utf8'),
    )
    copied.push(file)
  }
}
const addedScenes = []
for (const id of readdirSync(join(core, 'registry/scenes'))) {
  for (const f of readdirSync(join(core, 'registry/scenes', id)).filter((f) =>
    f.endsWith('.tsx'),
  )) {
    if (!existsSync(join(scenes, f))) {
      cpSync(join(core, 'registry/scenes', id, f), join(scenes, f))
      addedScenes.push(join(scenes, f))
    }
  }
}
const run = (cmd, args) => spawnSync(cmd, args, { cwd: site, encoding: 'utf8' })
run('pnpm', ['exec', 'next', 'typegen'])
const tsc = run('pnpm', ['exec', 'tsc', '--noEmit', '--pretty', 'false'])
const lint = run('pnpm', [
  'exec',
  'eslint',
  '--max-warnings=0',
  'components/sections/__registry__',
  'components/3d',
])
rmSync(target, { recursive: true, force: true })
for (const f of addedScenes) rmSync(f, { force: true })
const errors = `${tsc.stdout}${tsc.stderr}`.split('\n').filter((l) => l.includes('error TS'))
if (errors.length || lint.status !== 0) {
  console.error(errors.join('\n'))
  console.error(`${lint.stdout}${lint.stderr}`.trim())
  process.exit(1)
}
console.log(
  `registry ok: ${copied.length} sections and ${readdirSync(join(core, 'registry/scenes')).length} scenes type-check and lint clean`,
)
