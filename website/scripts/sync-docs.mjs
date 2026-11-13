// Builds the Starlight content from ../docs (the single source) and publishes agent-friendly twins:
// every page as raw Markdown at /<page>.md, plus llms.txt and llms-full.txt from `dss docs`.
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { docPages, pageSummary } from '../../cli/lib/docs.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../..')
const docs = join(root, 'docs')
const content = join(here, '../src/content/docs')
const pub = join(here, '../public')
const BASE = '/daroms-speed-site'

const GENERATED = /^<!--.*?-->\n/

/** Relative links between pages (`modules.md#x`) become site routes (`/daroms-speed-site/modules/#x`). */
function rewriteLinks(text) {
  return text.replace(/\]\(([\w-]+)\.md(#[\w-]+)?\)/g, (_, name, hash = '') =>
    name === 'index' ? `](${BASE}/${hash})` : `](${BASE}/${name}/${hash})`,
  )
}

function frontmatter(fields) {
  return `---\n${Object.entries(fields)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n')}\n---\n`
}

const pages = [
  ...docPages(docs).map((file) => ({ name: file.replace(/\.md$/, ''), source: join(docs, file) })),
  { name: 'cli', source: join(docs, 'cli.md') },
  { name: 'catalog', source: join(root, 'CATALOG.md') },
]

rmSync(content, { recursive: true, force: true })
mkdirSync(content, { recursive: true })
mkdirSync(pub, { recursive: true })

for (const { name, source } of pages) {
  const raw = readFileSync(source, 'utf8').replace(GENERATED, '')
  const { title, summary } = pageSummary(raw)
  const body = rewriteLinks(raw.replace(/^# .+\n+/m, ''))
  const head = [
    { tag: 'link', attrs: { rel: 'alternate', type: 'text/markdown', href: `${BASE}/${name}.md` } },
  ]
  writeFileSync(
    join(content, `${name}.md`),
    frontmatter({ title, description: summary || title, head }) + body,
  )
  writeFileSync(join(pub, `${name}.md`), raw)
}
for (const file of ['llms.txt', 'llms-full.txt']) copyFileSync(join(docs, file), join(pub, file))
console.log(`synced ${pages.length} pages and their Markdown twins`)
