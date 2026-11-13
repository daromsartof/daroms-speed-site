// Bundles the dss CLI for npm. Node refuses to strip TypeScript types under node_modules, so the
// published bin is plain JavaScript; inside a site the CLI still runs from core/cli/dss.ts directly.
import { chmodSync, rmSync } from 'node:fs'
import { build } from 'esbuild'

rmSync('dist/cli', { recursive: true, force: true })
await build({
  entryPoints: ['cli/dss.ts'],
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'node',
  target: 'node22.18',
  outdir: 'dist/cli',
  legalComments: 'none',
  logLevel: 'warning',
})
chmodSync('dist/cli/dss.js', 0o755)
console.log('dist/cli/dss.js built')
