import { ARCHETYPE_LIST, ARCHETYPES, type Archetype } from './archetypes.ts'
import { FONT_PAIRS } from './fonts.ts'
import { matchIndustry, type Industry } from './industries.ts'
import { between, createRng, pick, weightedPick, type Rng } from './random.ts'
import { DnaSchema, type ArchetypeId, type Dna, type Mode } from './schema.ts'

export type RollOptions = {
  seed: string
  /** Industry id or free text from the brief ("family bakery in Lyon"). */
  industry?: string
  /** Mood words from the brief ("warm", "premium", "bold"). */
  moods?: readonly string[]
  /** DNAs of previous sites, oldest first. Recent ones weigh the most. */
  history?: readonly Dna[]
  /** Fields forced by the user; the roller fills the rest around them. */
  lock?: { archetype?: ArchetypeId; mode?: Mode; hue?: number; fonts?: string }
  /** Number of candidates scored (default 96). */
  candidates?: number
}

const HISTORY_WINDOW = 12
const MIN_DISTANCE = 0.35
const SLOP_HUES: readonly [number, number] = [255, 305] // generic AI indigo/violet band

const hueDelta = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/** Distance between two DNAs in [0, 1]. 0 = same look, 1 = nothing in common. */
export function dnaDistance(a: Dna, b: Dna): number {
  const diff = (x: unknown, y: unknown) => (x === y ? 0 : 1)
  return (
    0.25 * diff(a.archetype, b.archetype) +
    0.2 * diff(a.fonts, b.fonts) +
    0.15 * (hueDelta(a.palette.hue, b.palette.hue) / 180) +
    0.1 * diff(a.palette.mode, b.palette.mode) +
    0.08 * diff(a.grid, b.grid) +
    0.05 * diff(a.texture, b.texture) +
    0.05 * diff(a.radius, b.radius) +
    0.04 * diff(a.motion, b.motion) +
    0.04 * diff(a.three, b.three) +
    0.04 * diff(a.imagery, b.imagery)
  )
}

function moodScore(archetype: Archetype, moods: readonly string[]): number {
  if (moods.length === 0) return 0
  const words = moods.map((m) => m.toLowerCase())
  return words.filter((w) =>
    archetype.moods.some((m) => m === w || m.startsWith(w) || w.startsWith(m)),
  ).length
}

function pickHue(rng: Rng, industry: Industry): number {
  if (industry.hues.length === 0) return rng() * 360
  const range = weightedPick(rng, industry.hues, ([lo, hi]) => hi - lo)
  return between(rng, range) % 360
}

function candidate(rng: Rng, opts: RollOptions, industry: Industry, moods: readonly string[]): Dna {
  const lock = opts.lock ?? {}
  const archetype = lock.archetype
    ? ARCHETYPES[lock.archetype]
    : weightedPick(rng, ARCHETYPE_LIST, (a) => {
        const affinity = industry.affinity[a.id] ?? 1
        return affinity === 0 ? 0 : affinity + 1.5 * moodScore(a, moods)
      })
  const pairs = FONT_PAIRS.filter((p) => p.fits.includes(archetype.id))
  const fonts = lock.fonts ?? pick(rng, pairs).id
  const hue = lock.hue ?? pickHue(rng, industry)
  const neutralHue = rng() < 0.25 ? (hue + 180) % 360 : (hue + between(rng, [-20, 20]) + 360) % 360
  return DnaSchema.parse({
    version: 1,
    seed: opts.seed,
    industry: industry.id,
    archetype: archetype.id,
    fonts,
    palette: {
      mode: lock.mode ?? pick(rng, archetype.modes),
      hue,
      chroma: between(rng, archetype.accentChroma),
      lightness: between(rng, archetype.accentLightness),
      neutralHue,
      neutralChroma: between(rng, archetype.neutralChroma),
      secondaryOffset: pick(rng, [-150, -30, 30, 150, 180]),
    },
    scale: pick(rng, archetype.scales),
    grid: pick(rng, archetype.grids),
    radius: pick(rng, archetype.radii),
    rules: pick(rng, archetype.rules),
    texture: pick(rng, archetype.textures),
    density: pick(rng, archetype.densities),
    imagery: pick(rng, archetype.imagery),
    motion: pick(rng, archetype.motions),
    three: pick(rng, archetype.three),
  })
}

/**
 * Rolls a Design DNA. Deterministic for the same options. Candidates are scored on fit to the
 * industry and moods, then penalised for resembling recent sites and for generic "AI" color choices.
 */
export function rollDna(opts: RollOptions): Dna {
  const rng = createRng(opts.seed)
  const industry = matchIndustry(opts.industry)
  const moods = opts.moods ?? []
  const wantsViolet = moods.some((m) => /purple|violet|lilac|lavender|indigo/i.test(m))
  const recent = (opts.history ?? []).slice(-HISTORY_WINDOW)
  let best: Dna | undefined
  let bestScore = -Infinity
  for (let i = 0; i < (opts.candidates ?? 96); i++) {
    const dna = candidate(rng, opts, industry, moods)
    const archetype = ARCHETYPES[dna.archetype]
    let score = (industry.affinity[dna.archetype] ?? 1) + 2 * moodScore(archetype, moods) + rng()
    let nearest = 1
    recent.forEach((past, index) => {
      const distance = dnaDistance(dna, past)
      const weight = 0.5 + (index + 1) / recent.length // newer sites weigh more
      score -= 3 * weight * (1 - distance)
      nearest = Math.min(nearest, distance)
    })
    if (nearest < MIN_DISTANCE) score -= 6 // near-duplicate of a recent site: last resort only
    const { hue, chroma } = dna.palette
    if (
      !wantsViolet &&
      !opts.lock?.hue &&
      hue >= SLOP_HUES[0] &&
      hue <= SLOP_HUES[1] &&
      chroma > 0.12
    ) {
      score -= 2.5
    }
    if (score > bestScore) {
      best = dna
      bestScore = score
    }
  }
  return best as Dna
}
