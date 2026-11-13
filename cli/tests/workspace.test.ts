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

describe('MCP recipes', () => {
  it('only ship complete configs', async () => {
    const { MCP_RECIPES } = await import('../commands/mcp.ts')
    for (const [name, recipe] of Object.entries(MCP_RECIPES)) {
      expect(recipe.config.url ?? recipe.config.command, name).toBeTruthy()
      if (recipe.config.url) expect(recipe.config.url, name).toMatch(/^https:\/\//)
      for (const arg of recipe.config.args ?? [])
        if (arg.startsWith('@')) expect(arg, `${name} pins a version`).toMatch(/@\d/)
      expect(recipe.setup.length, name).toBeGreaterThan(20)
    }
  })
})
