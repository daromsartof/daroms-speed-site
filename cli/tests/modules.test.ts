import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getModule, listModules, modulePresets } from '../lib/modules.ts'
import { CSP_PRESETS } from '../../packages/security/src/headers.ts'

describe('modules', () => {
  const modules = listModules()

  it('ships the v1 modules with a README', () => {
    expect(modules.map((m) => m.slug)).toEqual(
      expect.arrayContaining(['forms', 'legal', 'analytics', 'blog']),
    )
    for (const m of modules) expect(existsSync(join(m.dir, 'README.md')), m.slug).toBe(true)
  })

  it('references only known CSP presets and existing hook files', () => {
    for (const m of modules) {
      const presets = [...(m.csp ?? []), ...Object.values(m.cspFrom?.map ?? {}).flat()]
      for (const p of presets) expect(Object.keys(CSP_PRESETS), `${m.slug}: ${p}`).toContain(p)
      for (const hook of Object.values(m.hooks ?? {})) {
        const rel = hook.from.replace(/^@\//, '')
        const file = ['.ts', '.tsx'].map((ext) => join(m.dir, 'files', rel + ext)).find(existsSync)
        expect(file, `${m.slug}: ${hook.from}`).toBeTruthy()
        expect(readFileSync(file as string, 'utf8')).toContain(`function ${hook.import}`)
      }
    }
  })

  it('chooses CSP presets from config', () => {
    const analytics = getModule('analytics')
    expect(modulePresets(analytics, { provider: 'umami' })).toEqual(['umami'])
    expect(modulePresets(analytics, { provider: 'cloudflare' })).toEqual(['cloudflareAnalytics'])
    expect(modulePresets(getModule('forms'), {})).toEqual(['turnstile'])
  })

  it('declares page files for every page it registers', () => {
    for (const m of modules) {
      for (const page of m.pages ?? []) {
        expect(
          existsSync(
            join(m.dir, 'files', page.route === '/' ? 'app/page.tsx' : `app${page.route}/page.tsx`),
          ),
          `${m.slug} ${page.route}`,
        ).toBe(true)
      }
    }
  })
})
