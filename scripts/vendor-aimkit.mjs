// Vendors a pinned AimKit build (bridge + Chrome extension) into packages/aimkit.
// Source of truth: the domtake repository. Usage: node scripts/vendor-aimkit.mjs [path-to-domtake]
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const core = resolve(import.meta.dirname, '..')
const src = resolve(process.argv[2] ?? process.env.AIMKIT_SRC ?? join(core, '..', 'domtake'))
const bridge = join(src, 'packages/bridge')
const extension = join(src, 'packages/extension/dist')
if (!existsSync(join(bridge, 'package.json'))) {
  console.error(`AimKit source not found at ${src} (pass the domtake path)`)
  process.exit(2)
}
execFileSync('pnpm', ['build'], { cwd: src, stdio: 'inherit' })
const pkg = JSON.parse(readFileSync(join(bridge, 'package.json'), 'utf8'))
const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
  cwd: src,
  encoding: 'utf8',
}).trim()
const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
  cwd: src,
  encoding: 'utf8',
}).trim()
const target = join(core, 'packages/aimkit')
for (const dir of ['dist', 'extension']) rmSync(join(target, dir), { recursive: true, force: true })
cpSync(join(bridge, 'dist'), join(target, 'dist'), { recursive: true })
cpSync(extension, join(target, 'extension'), { recursive: true })
cpSync(join(bridge, 'LICENSE'), join(target, 'LICENSE'))
writeFileSync(
  join(target, 'package.json'),
  `${JSON.stringify(
    {
      name: '@dss/aimkit',
      version: pkg.version,
      private: true,
      type: 'module',
      description: `Vendored AimKit ${pkg.version}: browser element picker to Claude Code (HTTP bridge + MCP server + Chrome extension).`,
      bin: { aimkit: 'dist/cli.js' },
      exports: { './cli': './dist/cli.js' },
      dependencies: pkg.dependencies,
    },
    null,
    2,
  )}\n`,
)
writeFileSync(
  join(target, 'VENDOR.md'),
  [
    '# Vendored AimKit',
    '',
    `- Version: ${pkg.version}`,
    `- Source: domtake repository, branch ${branch}, commit ${commit}`,
    `- Vendored: ${new Date().toISOString().slice(0, 10)}`,
    '- Contents: bridge `dist/` (CLI, HTTP bridge, MCP server), built Chrome extension in `extension/`, MIT license.',
    '- Update: build domtake, then `node scripts/vendor-aimkit.mjs <path-to-domtake>`; never edit these files here.',
    '',
  ].join('\n'),
)
console.log(`AimKit ${pkg.version} (${commit}) vendored into packages/aimkit`)
