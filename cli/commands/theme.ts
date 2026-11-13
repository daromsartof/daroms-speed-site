import type { Args } from '../lib/args.ts'
import { log } from '../lib/log.ts'
import { siteRoot } from '../lib/paths.ts'
import { loadDna, loadManifest, writeTheme } from '../lib/site.ts'

/** dss theme: regenerates theme.css, fonts.ts, theme.ts (and the monogram icon) from design.dna.ts. */
export async function theme(_args: Args) {
  const root = siteRoot()
  const dna = await loadDna(root)
  const { manifest } = await loadManifest(root)
  log.ok(`theme regenerated: ${writeTheme(root, dna, manifest.name).join(', ')}`)
}
