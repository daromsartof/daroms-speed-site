import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs'
import { join, relative } from 'node:path'
import { CORE_DIR, brainDir } from './paths.ts'

const FOLDERS = [
  'raw',
  'wiki/industries',
  'wiki/patterns',
  'wiki/voice',
  'wiki/fixes',
  'wiki/stacks',
  'wiki/sites',
]

/** Creates the brain (schema, index, log, folders) without touching existing files. Returns created paths. */
export function initBrain(dir = brainDir()): string[] {
  const created: string[] = []
  for (const folder of FOLDERS) {
    if (!existsSync(join(dir, folder))) {
      mkdirSync(join(dir, folder), { recursive: true })
      created.push(`${folder}/`)
    }
  }
  for (const file of ['CLAUDE.md', 'index.md', 'log.md']) {
    if (!existsSync(join(dir, file))) {
      copyFileSync(join(CORE_DIR, '_ai/brain-schema', file), join(dir, file))
      created.push(file)
    }
  }
  return created
}

export function appendLog(op: string, site: string, summary: string, dir = brainDir()) {
  if (!existsSync(join(dir, 'log.md'))) initBrain(dir)
  appendFileSync(
    join(dir, 'log.md'),
    `## [${new Date().toISOString().slice(0, 10)}] ${op} | ${site} | ${summary}\n`,
  )
}

const words = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .match(/[a-z0-9]{3,}/g) ?? []

/** Same word, or a shared stem of 5+ letters ("architect" ~ "architecture", "restaurant" ~ "restaurants"). */
export function overlap(query: Set<string>, line: Set<string>): number {
  let score = 0
  for (const q of query) {
    for (const w of line) {
      const short = q.length < w.length ? q : w
      const long = short === q ? w : q
      if (q === w || (short.length >= 5 && long.startsWith(short))) {
        score++
        break
      }
    }
  }
  return score
}

export type BrainHit = { line: string; score: number }

/** Index lines ranked by shared words with the query (index-first retrieval, no embeddings). */
export function queryIndex(query: string, dir = brainDir(), limit = 8): BrainHit[] {
  const file = join(dir, 'index.md')
  if (!existsSync(file)) return []
  const wanted = new Set(words(query))
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('- ['))
    .map((line) => ({ line, score: overlap(wanted, new Set(words(line))) }))
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

function pages(dir: string): string[] {
  const base = join(dir, 'wiki')
  if (!existsSync(base)) return []
  const out: string[] = []
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name)
      if (statSync(p).isDirectory()) walk(p)
      else if (name.endsWith('.md')) out.push(relative(dir, p))
    }
  }
  walk(base)
  return out.sort()
}

export type BrainStatus = {
  dir: string
  pages: number
  indexed: number
  orphans: string[]
  sites: number
  lastLog?: string
}

/** Counts and orphan pages (wiki pages missing from index.md). */
export function brainStatus(dir = brainDir()): BrainStatus {
  const index = existsSync(join(dir, 'index.md')) ? readFileSync(join(dir, 'index.md'), 'utf8') : ''
  const all = pages(dir)
  const orphans = all.filter((p) => !index.includes(`(${p})`))
  const history = existsSync(join(dir, 'dna-history.jsonl'))
    ? readFileSync(join(dir, 'dna-history.jsonl'), 'utf8').split('\n').filter(Boolean).length
    : 0
  const log = existsSync(join(dir, 'log.md'))
    ? readFileSync(join(dir, 'log.md'), 'utf8')
        .split('\n')
        .filter((l) => l.startsWith('## ['))
    : []
  return {
    dir,
    pages: all.length,
    indexed: all.length - orphans.length,
    orphans,
    sites: history,
    lastLog: log.at(-1),
  }
}
