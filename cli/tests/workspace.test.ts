import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ensureCorePackage } from '../lib/workspace.ts'

describe('ensureCorePackage', () => {
  it('adds the workspace entry, the package and the libraries site code imports, once', () => {
    const root = mkdtempSync(join(tmpdir(), 'dss-ws-'))
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages:\n  - core/packages/ui\n')
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({ dependencies: { next: '16.4.6' }, devDependencies: {} }),
    )
    expect(ensureCorePackage(root, 'three')).toBe(true)
    expect(ensureCorePackage(root, 'three')).toBe(false)
    expect(readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8')).toContain(
      '  - core/packages/three\n',
    )
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as Record<
      string,
      Record<string, string>
    >
    expect(pkg.dependencies).toMatchObject({
      '@dss/three': 'workspace:*',
      three: '0.187.0',
      '@react-three/fiber': '9.8.2',
    })
    expect(pkg.devDependencies).toMatchObject({ '@types/three': '0.187.0' })
  })
})
