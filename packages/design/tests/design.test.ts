import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import {
  ARCHETYPE_IDS,
  ARCHETYPES,
  colorTokens,
  CONTRAST,
  contrastOklch,
  dnaDistance,
  FONT_PAIRS,
  INDUSTRIES,
  matchIndustry,
  renderFontsTs,
  renderThemeCss,
  renderThemeTs,
  rollDna,
  type Dna,
} from '../src/index.ts'

type FontData = Record<string, { weights: string[]; styles: string[]; axes?: { tag: string }[] }>
const require = createRequire(import.meta.url)
const fontData = require('next/dist/compiled/@next/font/dist/google/font-data.json') as FontData

describe('font pairs', () => {
  const specs = FONT_PAIRS.flatMap((p) => [p.display, p.body, ...(p.mono ? [p.mono] : [])])

  it.each(specs.map((s) => [s.family, s] as const))('%s loads through next/font', (family, spec) => {
    const data = fontData[family]
    expect(data, `${family} is not a Google font known to next/font`).toBeDefined()
    if (!data) return
    const variable = data.weights.includes('variable')
    if (!variable) expect(spec.weights?.length, `${family} is static: list weights`).toBeGreaterThan(0)
    for (const w of spec.weights ?? []) expect(data.weights).toContain(w)
    for (const axis of spec.axes ?? []) {
      expect(variable, `${family} has no variable axes`).toBe(true)
      expect(data.axes?.map((a) => a.tag)).toContain(axis)
    }
    if (spec.italic) expect(data.styles).toContain('italic')
  })

  it('gives every archetype at least three pairings', () => {
    for (const id of ARCHETYPE_IDS) {
      expect(FONT_PAIRS.filter((p) => p.fits.includes(id)).length, id).toBeGreaterThanOrEqual(3)
    }
  })

  it('has unique ids', () => {
    expect(new Set(FONT_PAIRS.map((p) => p.id)).size).toBe(FONT_PAIRS.length)
  })
})

describe('rollDna', () => {
  it('is deterministic for the same options', () => {
    expect(rollDna({ seed: 'acme', industry: 'restaurant' })).toEqual(
      rollDna({ seed: 'acme', industry: 'restaurant' }),
    )
  })

  it('never picks an archetype the industry excludes', () => {
    for (let i = 0; i < 40; i++) {
      const dna = rollDna({ seed: `law-${i}`, industry: 'legal' })
      expect(['playful', 'brutalist', 'kinetic-type']).not.toContain(dna.archetype)
    }
  })

  it('follows moods', () => {
    const picks = Array.from({ length: 30 }, (_, i) =>
      rollDna({ seed: `m-${i}`, moods: ['luxurious', 'elegant', 'refined'] }).archetype,
    )
    expect(picks.filter((a) => a === 'luxury').length).toBeGreaterThan(10)
  })

  it('respects locks', () => {
    const dna = rollDna({ seed: 'x', lock: { archetype: 'swiss', mode: 'dark', hue: 20 } })
    expect(dna).toMatchObject({ archetype: 'swiss', palette: { mode: 'dark', hue: 20 } })
  })

  it('avoids repeating recent sites', () => {
    const history: Dna[] = []
    for (let i = 0; i < 8; i++) history.push(rollDna({ seed: `site-${i}`, industry: 'restaurant', history }))
    for (let i = 1; i < history.length; i++) {
      const nearest = Math.min(...history.slice(0, i).map((past) => dnaDistance(history[i] as Dna, past)))
      expect(nearest, `site ${i} too close to a previous one`).toBeGreaterThan(0.3)
    }
  })

  it('steers away from the generic indigo/violet band unless asked', () => {
    const violet = Array.from({ length: 60 }, (_, i) => rollDna({ seed: `v-${i}`, industry: 'saas' })).filter(
      (d) => d.palette.hue >= 255 && d.palette.hue <= 305 && d.palette.chroma > 0.12,
    )
    expect(violet.length).toBeLessThan(6)
  })
})

describe('color tokens', () => {
  const dnas = INDUSTRIES.flatMap((ind) =>
    Array.from({ length: 12 }, (_, i) => rollDna({ seed: `${ind.id}-${i}`, industry: ind.id })),
  )
  const locked = ARCHETYPE_IDS.flatMap((archetype) =>
    (['light', 'dark'] as const).map((mode) => rollDna({ seed: `${archetype}-${mode}`, lock: { archetype, mode } })),
  )

  it.each([...dnas, ...locked].map((d) => [`${d.seed} ${d.archetype} ${d.palette.mode}`, d] as const))(
    '%s meets WCAG minimums',
    (_name, dna) => {
      const t = colorTokens(dna)
      for (const bg of [t.surface, t['surface-2']]) {
        expect(contrastOklch(t.ink, bg)).toBeGreaterThanOrEqual(CONTRAST.ink - 0.01)
        expect(contrastOklch(t['ink-muted'], bg)).toBeGreaterThanOrEqual(CONTRAST.inkMuted - 0.01)
        expect(contrastOklch(t['accent-text'], bg)).toBeGreaterThanOrEqual(CONTRAST.accentText - 0.01)
      }
      expect(contrastOklch(t['accent-ink'], t.accent)).toBeGreaterThanOrEqual(CONTRAST.accentInk - 0.01)
    },
  )
})

describe('renderers', () => {
  const dna = rollDna({ seed: 'render', industry: 'artisan' })

  it('emits a Tailwind v4 theme with every token', () => {
    const css = renderThemeCss(dna)
    expect(css).toContain('@theme {')
    for (const token of ['surface', 'ink', 'accent', 'accent-text', 'line']) expect(css).toContain(`--color-${token}:`)
    expect(css).toContain('--font-display: var(--font-face-display)')
    expect(css).not.toMatch(/#[0-9a-f]{6}/i)
  })

  it('emits next/font loaders that reference the pairing', () => {
    const ts = renderFontsTs(dna)
    expect(ts).toMatch(/^\/\/ GENERATED/)
    expect(ts).toContain("from 'next/font/google'")
    expect(ts).toContain("variable: '--font-face-display'")
    expect(ts).toContain('export const fontVariables')
  })

  it('loads a shared family once', () => {
    const ts = renderFontsTs(rollDna({ seed: 's', lock: { archetype: 'swiss', fonts: 'archivo-wide' } }))
    expect(ts.match(/Archivo\(/g)).toHaveLength(1)
    expect(renderThemeCss(rollDna({ seed: 's', lock: { archetype: 'swiss', fonts: 'archivo-wide' } }))).toContain(
      '--font-body: var(--font-face-display)',
    )
  })

  it('emits a literal theme color', () => {
    expect(renderThemeTs(dna)).toMatch(/themeColor = '#[0-9a-f]{6}'/)
  })
})

describe('catalogs', () => {
  it('matches industries from free text', () => {
    expect(matchIndustry('A family bakery in Lyon').id).toBe('cafe-bakery')
    expect(matchIndustry('cabinet d\'avocat à Genève').id).toBe('legal')
    expect(matchIndustry('something unusual').id).toBe('general')
  })

  it('keeps archetype ranges valid', () => {
    for (const a of Object.values(ARCHETYPES)) {
      expect(a.accentChroma[0]).toBeLessThanOrEqual(a.accentChroma[1])
      expect(a.modes.length).toBeGreaterThan(0)
    }
  })
})
