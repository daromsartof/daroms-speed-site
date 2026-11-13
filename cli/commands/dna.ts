import {
  ARCHETYPE_IDS,
  designRead,
  FONT_PAIRS,
  rollDna,
  type ArchetypeId,
} from '../../packages/design/src/index.ts'
import { bool, flag, list, type Args } from '../lib/args.ts'
import { fail, log } from '../lib/log.ts'
import { siteRoot } from '../lib/paths.ts'
import {
  loadDna,
  loadManifest,
  readHistory,
  recordHistory,
  saveDna,
  writeTheme,
} from '../lib/site.ts'

/** dss dna roll|show */
export async function dna(args: Args) {
  const [sub] = args._
  const root = siteRoot()
  if (sub === 'show' || !sub) {
    const current = await loadDna(root)
    console.log(designRead(current))
    return
  }
  if (sub !== 'roll') fail('usage: dss dna roll|show')
  const { manifest } = await loadManifest(root)
  const archetype = flag(args, 'archetype')
  if (archetype && !ARCHETYPE_IDS.includes(archetype as ArchetypeId))
    fail(`archetype: ${ARCHETYPE_IDS.join(', ')}`)
  const fonts = flag(args, 'fonts')
  if (fonts && !FONT_PAIRS.some((p) => p.id === fonts))
    fail(`fonts: ${FONT_PAIRS.map((p) => p.id).join(', ')}`)
  const mode = flag(args, 'mode')
  if (mode && mode !== 'light' && mode !== 'dark') fail('mode: light | dark')
  const hue = flag(args, 'hue')
  const site = manifest.name
  const next = rollDna({
    seed: flag(args, 'seed') ?? `${site}-${Date.now()}`,
    industry: flag(args, 'industry') ?? manifest.industry,
    moods: list(args, 'mood'),
    history: readHistory(site),
    lock: {
      ...(archetype ? { archetype: archetype as ArchetypeId } : {}),
      ...(mode ? { mode: mode as 'light' | 'dark' } : {}),
      ...(hue ? { hue: Number(hue) } : {}),
      ...(fonts ? { fonts } : {}),
    },
  })
  if (bool(args, 'dry')) {
    console.log(designRead(next))
    return
  }
  saveDna(root, next)
  const written = writeTheme(root, next, site)
  recordHistory(site, next)
  log.ok(designRead(next))
  log.info(`wrote design.dna.ts, ${written.join(', ')}`)
}
