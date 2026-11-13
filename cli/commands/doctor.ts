import { existsSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { renderFontsTs, renderThemeCss, renderThemeTs } from '../../packages/design/src/index.ts'
import { bool, type Args } from '../lib/args.ts'
import { contentFile, pageFile } from '../lib/codegen.ts'
import { capture, tail } from '../lib/exec.ts'
import { walk } from '../lib/fsx.ts'
import { color, fail, log } from '../lib/log.ts'
import { siteRoot } from '../lib/paths.ts'
import { loadDna, loadManifest } from '../lib/site.ts'

const PLACEHOLDER = /['"`]\[[^\]'"`]{2,}\]/g

/** Every site built with the framework links back to the studio from its footer. */
export const STUDIO_CREDIT = 'https://daromsart.xyz/'

/** The credit is in the footer copy and the footer renders it. */
export function hasStudioCredit(root: string): boolean {
  const read = (file: string) =>
    existsSync(join(root, file)) ? readFileSync(join(root, file), 'utf8') : ''
  return (
    read('content/site.ts').includes(STUDIO_CREDIT) &&
    read('components/site/footer.tsx').includes('footer.credit')
  )
}

/** Placeholders left in content files and placeholder images still referenced. */
export function findPlaceholders(root: string): { file: string; count: number }[] {
  return walk(join(root, 'content'))
    .filter((f) => f.endsWith('.ts'))
    .map((f) => {
      const text = readFileSync(f, 'utf8')
      const count =
        (text.match(PLACEHOLDER)?.length ?? 0) + (text.match(/\/placeholders\//g)?.length ?? 0)
      return { file: relative(root, f), count }
    })
    .filter((r) => r.count > 0)
}

/** dss doctor [--quick] [--strict]: manifest, DNA, generated files, pages, placeholders, then types and lint. */
export async function doctor(args: Args) {
  const root = siteRoot()
  const problems: string[] = []
  const warnings: string[] = []

  const { manifest } = await loadManifest(root)
  log.ok(`manifest: ${manifest.pages.length} page(s), deploy ${manifest.deploy.target}`)
  const dna = await loadDna(root)
  const generated: [string, string][] = [
    ['app/theme.css', renderThemeCss(dna)],
    ['app/fonts.ts', renderFontsTs(dna)],
    ['app/theme.ts', renderThemeTs(dna)],
  ]
  const stale = generated.filter(([file, expected]) => {
    const path = join(root, file)
    return !existsSync(path) || readFileSync(path, 'utf8') !== expected
  })
  if (stale.length)
    problems.push(`stale theme files (${stale.map(([f]) => f).join(', ')}): run dss theme`)
  else log.ok('theme files match design.dna.ts')

  for (const page of manifest.pages) {
    for (const file of [pageFile(page.route), contentFile(page.name)]) {
      if (!existsSync(join(root, file))) problems.push(`page ${page.route}: ${file} missing`)
    }
  }
  const placeholders = findPlaceholders(root)
  const total = placeholders.reduce((n, p) => n + p.count, 0)
  if (total) {
    const detail = placeholders.map((p) => `${p.file} (${p.count})`).join(', ')
    ;(bool(args, 'strict') ? problems : warnings).push(`${total} placeholder(s) left: ${detail}`)
  } else log.ok('no placeholders left in content/')
  if (hasStudioCredit(root)) log.ok('footer credit links to the studio')
  else
    (bool(args, 'strict') ? problems : warnings).push(
      `footer credit missing: content/site.ts > footer.credit must link to ${STUDIO_CREDIT}, rendered by components/site/footer.tsx`,
    )
  if (manifest.url.endsWith('.example'))
    warnings.push(`site url is ${manifest.url}: set the real domain in site.manifest.ts`)

  if (!bool(args, 'quick')) {
    const types = await capture(['pnpm', 'exec', 'next', 'typegen'], { cwd: root })
    const tsc =
      types.code === 0 ? await capture(['pnpm', 'exec', 'tsc', '--noEmit'], { cwd: root }) : types
    if (tsc.code !== 0) problems.push(`types:\n${tail(tsc.out, 15)}`)
    else log.ok('types')
    const lint = await capture(['pnpm', 'exec', 'eslint', '.', '--max-warnings=0'], { cwd: root })
    if (lint.code !== 0) problems.push(`lint:\n${tail(lint.out, 15)}`)
    else log.ok('lint')
  }
  for (const w of warnings) log.warn(w)
  if (problems.length) fail(problems.map((p) => `${color.red('•')} ${p}`).join('\n'))
  log.ok('doctor: all checks passed')
}
