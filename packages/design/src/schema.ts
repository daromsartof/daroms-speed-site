import { z } from 'zod'

export const ARCHETYPE_IDS = [
  'editorial',
  'swiss',
  'brutalist',
  'luxury',
  'organic',
  'tech-noir',
  'playful',
  'retro-print',
  'minimal-mono',
  'magazine',
  'architectural',
  'kinetic-type',
  'craft',
  'institutional',
] as const
export type ArchetypeId = (typeof ARCHETYPE_IDS)[number]

export const GRIDS = [
  'centered',
  'asymmetric',
  'editorial-12',
  'swiss',
  'bento',
  'fullbleed',
  'split',
] as const
export const RADII = ['none', 'subtle', 'soft', 'pill'] as const
export const RULES = ['none', 'hairline', 'bold'] as const
export const TEXTURES = ['none', 'grain', 'paper', 'mesh', 'halftone', 'grid-lines'] as const
export const DENSITIES = ['airy', 'balanced', 'dense'] as const
export const IMAGERY = [
  'photo-documentary',
  'photo-studio',
  'illustration',
  '3d-render',
  'type-only',
  'abstract-shapes',
] as const
export const MOTIONS = ['none', 'subtle', 'expressive', 'cinematic'] as const
export const THREE_LEVELS = ['none', 'accent', 'hero', 'immersive'] as const
export const TYPE_SCALES = ['tight', 'classic', 'dramatic'] as const
export const MODES = ['light', 'dark'] as const

export type Grid = (typeof GRIDS)[number]
export type Radius = (typeof RADII)[number]
export type Rules = (typeof RULES)[number]
export type Texture = (typeof TEXTURES)[number]
export type Density = (typeof DENSITIES)[number]
export type Imagery = (typeof IMAGERY)[number]
export type Motion = (typeof MOTIONS)[number]
export type ThreeLevel = (typeof THREE_LEVELS)[number]
export type TypeScale = (typeof TYPE_SCALES)[number]
export type Mode = (typeof MODES)[number]

const unit = z.number().min(0).max(1)

export const DnaSchema = z.object({
  version: z.literal(1),
  seed: z.string().min(1),
  industry: z.string().default('general'),
  archetype: z.enum(ARCHETYPE_IDS),
  fonts: z.string().min(1),
  palette: z.object({
    mode: z.enum(MODES),
    /** Accent hue in degrees (OKLCH). */
    hue: z.number().min(0).max(360),
    /** Accent chroma (OKLCH, gamut-mapped at render). */
    chroma: z.number().min(0).max(0.37),
    /** Accent lightness (OKLCH). */
    lightness: unit,
    /** Hue of the neutrals (surface, ink). Usually near the accent hue. */
    neutralHue: z.number().min(0).max(360),
    /** Chroma of the neutrals: 0 = pure grey, 0.02 = clearly tinted. */
    neutralChroma: z.number().min(0).max(0.05),
    /** Secondary color offset from the accent hue (degrees), used sparingly. */
    secondaryOffset: z.number().min(-180).max(180),
  }),
  scale: z.enum(TYPE_SCALES),
  grid: z.enum(GRIDS),
  radius: z.enum(RADII),
  rules: z.enum(RULES),
  texture: z.enum(TEXTURES),
  density: z.enum(DENSITIES),
  imagery: z.enum(IMAGERY),
  motion: z.enum(MOTIONS),
  three: z.enum(THREE_LEVELS),
})

export type Dna = z.infer<typeof DnaSchema>
export type DnaInput = z.input<typeof DnaSchema>

/** Validates a DNA object; use in design.dna.ts: `export default defineDna({...})`. */
export function defineDna(input: DnaInput): Dna {
  return DnaSchema.parse(input)
}
