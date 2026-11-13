import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildCatalog, buildDigest, parseCatalog } from '../lib/ai.ts'
import { CORE_DIR } from '../lib/paths.ts'

describe('generated AI files', () => {
  it('CATALOG.md is up to date (run pnpm catalog)', () => {
    expect(readFileSync(join(CORE_DIR, 'CATALOG.md'), 'utf8')).toBe(buildCatalog(CORE_DIR))
  })

  it('_ai/digest.md is up to date (run pnpm catalog)', () => {
    expect(readFileSync(join(CORE_DIR, '_ai/digest.md'), 'utf8')).toBe(
      buildDigest(join(CORE_DIR, '_ai')),
    )
  })

  it('every rule has a one-line summary', () => {
    const digest = buildDigest(join(CORE_DIR, '_ai'))
    for (const line of digest.split('\n').filter((l) => l.startsWith('- **'))) {
      expect(line.split(': ').slice(1).join(': ').length, line).toBeGreaterThan(20)
    }
  })

  it('parses catalog blocks without cutting at package names', () => {
    expect(parseCatalog('/** @catalog A: pair with x() from @dss/seo. @props a, b */')).toEqual([
      { name: 'A: pair with x() from @dss/seo.', props: 'a, b' },
    ])
  })
})
