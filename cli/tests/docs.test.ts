import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { COMMANDS } from '../commands.ts'
import {
  brokenLinks,
  buildCliDoc,
  buildLlms,
  buildLlmsFull,
  docPages,
  pageSummary,
} from '../lib/docs.ts'
import { CORE_DIR } from '../lib/paths.ts'

const docs = join(CORE_DIR, 'docs')

describe('docs', () => {
  it('generated files are up to date (run pnpm run docs)', () => {
    expect(readFileSync(join(docs, 'cli.md'), 'utf8')).toBe(buildCliDoc())
    expect(readFileSync(join(docs, 'llms.txt'), 'utf8')).toBe(buildLlms(docs))
    expect(readFileSync(join(docs, 'llms-full.txt'), 'utf8')).toBe(buildLlmsFull(docs, CORE_DIR))
  })

  it('every page has a title and a one-line summary, and links resolve', () => {
    for (const page of docPages(docs)) {
      const { title, summary } = pageSummary(readFileSync(join(docs, page), 'utf8'))
      expect(title, page).toBeTruthy()
      expect(summary.length, page).toBeGreaterThan(30)
    }
    expect(brokenLinks(docs)).toEqual([])
  })

  it('documents every command', () => {
    const cli = buildCliDoc()
    for (const name of Object.keys(COMMANDS)) expect(cli).toContain(`\`dss ${name}\``)
  })
})
