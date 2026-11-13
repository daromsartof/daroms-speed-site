import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { appendLog, brainStatus, initBrain, queryIndex } from '../lib/brain.ts'

describe('brain', () => {
  it('initialises once, logs, queries the index first and reports orphans', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dss-brain-'))
    expect(initBrain(dir)).toEqual(
      expect.arrayContaining(['CLAUDE.md', 'index.md', 'log.md', 'wiki/industries/']),
    )
    expect(initBrain(dir)).toEqual([])
    writeFileSync(
      join(dir, 'index.md'),
      '## Industries\n- [Restaurants](wiki/industries/restaurant.md): menus as rows, hours above the fold (restaurant, food)\n- [Law firms](wiki/industries/legal.md): named partners first (legal)\n',
    )
    writeFileSync(join(dir, 'wiki/industries/restaurant.md'), '---\ntitle: Restaurants\n---\n')
    writeFileSync(join(dir, 'wiki/patterns/menu.md'), '---\ntitle: Menu\n---\n')
    expect(queryIndex('family italian restaurant in Lyon', dir)[0]?.line).toContain('Restaurants')
    expect(queryIndex('blockchain', dir)).toEqual([])
    expect(queryIndex('restaurants and their menus', dir)[0]?.score).toBe(2)
    appendLog('ingest', 'trattoria', 'menu rows worked', dir)
    expect(readFileSync(join(dir, 'log.md'), 'utf8')).toMatch(
      /## \[\d{4}-\d{2}-\d{2}\] ingest \| trattoria \| menu rows worked/,
    )
    const status = brainStatus(dir)
    expect(status.pages).toBe(2)
    expect(status.orphans).toEqual(['wiki/patterns/menu.md'])
  })
})
