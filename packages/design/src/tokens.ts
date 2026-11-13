import { contrastOklch, type Oklch } from './color.ts'
import type { Dna } from './schema.ts'

export const COLOR_TOKENS = [
  'surface',
  'surface-2',
  'surface-3',
  'ink',
  'ink-muted',
  'line',
  'rule',
  'accent',
  'accent-ink',
  'accent-text',
  'secondary',
] as const
export type ColorToken = (typeof COLOR_TOKENS)[number]
export type ColorTokens = Record<ColorToken, Oklch>

/** Minimum WCAG contrast each text token keeps against `surface` (and `surface-2`). */
export const CONTRAST = { ink: 7, inkMuted: 4.5, accentText: 4.5, accentInk: 4.5 } as const

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Moves lightness one step at a time until `ok` passes or the bound is hit. */
function adjustUntil(color: Oklch, direction: 1 | -1, ok: (c: Oklch) => boolean): Oklch {
  let current = color
  for (let i = 0; i < 100 && !ok(current); i++) {
    const l = clamp01(current.l + direction * 0.01)
    if (l === current.l) break
    current = { ...current, l }
  }
  return current
}

const contrastAll = (c: Oklch, backgrounds: Oklch[], min: number) =>
  backgrounds.every((bg) => contrastOklch(c, bg) >= min)

/**
 * Semantic color tokens for a DNA. Every text token is pushed (lightness only, hue kept) until it
 * meets its WCAG minimum, so any DNA the roller produces is accessible by construction.
 */
export function colorTokens(dna: Dna): ColorTokens {
  const p = dna.palette
  const dark = p.mode === 'dark'
  const toward = dark ? 1 : -1 // direction that increases contrast against the surface
  const nh = p.neutralHue
  const nc = p.neutralChroma

  const surface: Oklch = dark
    ? { l: 0.17 - nc, c: nc * 0.8, h: nh }
    : { l: 0.985 - nc * 1.4, c: nc * 0.7, h: nh }
  const surface2: Oklch = { ...surface, l: surface.l + (dark ? 0.045 : -0.03), c: nc }
  const surface3: Oklch = { ...surface, l: surface.l + (dark ? 0.1 : -0.075), c: nc * 1.1 }
  const bgs = [surface, surface2]

  const ink = adjustUntil(
    { l: dark ? 0.94 : 0.21, c: Math.min(nc * 1.2, 0.03), h: nh },
    toward,
    (c) => contrastAll(c, bgs, CONTRAST.ink),
  )
  const inkMuted = adjustUntil(
    { l: dark ? 0.72 : 0.47, c: Math.min(nc * 1.3, 0.035), h: nh },
    toward,
    (c) => contrastAll(c, bgs, CONTRAST.inkMuted),
  )
  const line: Oklch = { l: surface.l + (dark ? 0.14 : -0.12), c: nc, h: nh }
  const rule: Oklch = dna.rules === 'bold' ? ink : line

  let accent: Oklch = { l: p.lightness, c: p.chroma, h: p.hue }
  const light: Oklch = { l: 0.985, c: 0.01, h: p.hue }
  const darkInk: Oklch = { l: 0.17, c: 0.02, h: p.hue }
  const useLight = contrastOklch(light, accent) >= contrastOklch(darkInk, accent)
  const accentInk = useLight ? light : darkInk
  // If neither ink reaches 4.5 on the accent, move the accent away from the chosen ink.
  accent = adjustUntil(
    accent,
    useLight ? -1 : 1,
    (c) => contrastOklch(accentInk, c) >= CONTRAST.accentInk,
  )

  const accentText = adjustUntil({ l: p.lightness, c: p.chroma, h: p.hue }, toward, (c) =>
    contrastAll(c, bgs, CONTRAST.accentText),
  )
  const secondary: Oklch = {
    l: clamp01(dark ? Math.max(p.lightness, 0.7) : Math.min(p.lightness, 0.62)),
    c: p.chroma * 0.85,
    h: (p.hue + p.secondaryOffset + 360) % 360,
  }

  return {
    surface,
    'surface-2': surface2,
    'surface-3': surface3,
    ink,
    'ink-muted': inkMuted,
    line,
    rule,
    accent,
    'accent-ink': accentInk,
    'accent-text': accentText,
    secondary,
  }
}
