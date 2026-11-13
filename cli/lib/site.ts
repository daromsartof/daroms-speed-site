import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Dna } from '../../packages/design/src/index.ts'
import {
  DnaSchema,
  renderFontsTs,
  renderIconSvg,
  renderThemeCss,
  renderThemeTs,
} from '../../packages/design/src/index.ts'
import type { Manifest, ManifestInput } from '../../packages/site/src/config.ts'
import { writeFile } from './fsx.ts'
import { fail } from './log.ts'
import { brainDir } from './paths.ts'
import { toTs } from './serialize.ts'

const INPUT = Symbol.for('dss.manifest.input')

async function importFresh<T>(file: string): Promise<T> {
  try {
    return ((await import(`${pathToFileURL(file).href}?t=${Date.now()}`)) as { default: T }).default
  } catch (error) {
    fail(
      `${file.split('/').pop()} could not be loaded:\n${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/** Loads site.manifest.ts: parsed values plus the raw input used to rewrite the file. */
export async function loadManifest(
  root: string,
): Promise<{ manifest: Manifest; input: ManifestInput }> {
  const manifest = await importFresh<Manifest>(join(root, 'site.manifest.ts'))
  const raw = (manifest as unknown as Record<symbol, ManifestInput | undefined>)[INPUT] ?? manifest
  return { manifest, input: structuredClone(raw) }
}

export function renderManifest(input: ManifestInput): string {
  return [
    "// The site's structure and settings. Rewritten by the dss CLI (pages, modules, deploy): keep literal values.",
    "import { defineManifest } from '@dss/site/config'",
    '',
    `export default defineManifest(${toTs(input)})`,
    '',
  ].join('\n')
}

export function saveManifest(root: string, input: ManifestInput) {
  writeFile(join(root, 'site.manifest.ts'), renderManifest(input))
}

export async function loadDna(root: string): Promise<Dna> {
  return DnaSchema.parse(await importFresh<Dna>(join(root, 'design.dna.ts')))
}

export function renderDna(dna: Dna): string {
  return [
    '// Design DNA. Written by `dss dna roll`; `dss theme` regenerates app/theme.css, app/fonts.ts, app/theme.ts.',
    "import { defineDna } from '@dss/design'",
    '',
    `export default defineDna(${toTs(dna)})`,
    '',
  ].join('\n')
}

export function saveDna(root: string, dna: Dna) {
  writeFile(join(root, 'design.dna.ts'), renderDna(dna))
}

/** Writes the generated theme files. A custom app/icon.svg (no dss-monogram marker) is kept. */
export function writeTheme(root: string, dna: Dna, siteName: string): string[] {
  const written = ['app/theme.css', 'app/fonts.ts', 'app/theme.ts']
  writeFile(join(root, 'app/theme.css'), renderThemeCss(dna))
  writeFile(join(root, 'app/fonts.ts'), renderFontsTs(dna))
  writeFile(join(root, 'app/theme.ts'), renderThemeTs(dna))
  const icon = join(root, 'app/icon.svg')
  if (!existsSync(icon) || readFileSync(icon, 'utf8').includes('dss-monogram')) {
    writeFile(icon, renderIconSvg(dna, siteName))
    written.push('app/icon.svg')
  }
  return written
}

const historyFile = () => join(brainDir(), 'dna-history.jsonl')

/** DNAs of previous sites (oldest first), for the anti-repetition roller. */
export function readHistory(exclude?: string): Dna[] {
  const file = historyFile()
  if (!existsSync(file)) return []
  const out: Dna[] = []
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue
    try {
      const entry = JSON.parse(line) as { site?: string; dna?: unknown }
      if (exclude && entry.site === exclude) continue
      const parsed = DnaSchema.safeParse(entry.dna)
      if (parsed.success) out.push(parsed.data)
    } catch {
      // a corrupt line never blocks a roll
    }
  }
  return out
}

/** One entry per site: re-rolling a site replaces its previous DNA instead of piling up. */
export function recordHistory(site: string, dna: Dna) {
  mkdirSync(brainDir(), { recursive: true })
  const file = historyFile()
  const kept = existsSync(file)
    ? readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => line.trim() && !line.includes(`"site":${JSON.stringify(site)}`))
    : []
  kept.push(JSON.stringify({ date: new Date().toISOString(), site, dna }))
  writeFileSync(file, `${kept.join('\n')}\n`)
}
