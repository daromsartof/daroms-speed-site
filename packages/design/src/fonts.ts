import type { ArchetypeId } from './schema.ts'

/**
 * A font as loaded through `next/font/google`. `family` is the Google family name.
 * Static families must list `weights`; variable families load the full axis.
 * `axes` lists extra variable axes (never `wght`).
 */
export type FontSpec = {
  family: string
  weights?: readonly string[]
  axes?: readonly string[]
  italic?: boolean
}

export type FontPair = {
  id: string
  display: FontSpec
  body: FontSpec
  /** Optional mono face for data, code or labels. */
  mono?: FontSpec
  /** Archetypes this pairing serves well. Every archetype has at least three pairs. */
  fits: readonly ArchetypeId[]
  /** Short reason, shown to the agent in CATALOG.md. */
  note: string
}

// Curated pairings. Deliberately absent as defaults: Inter, Roboto, Open Sans, Montserrat,
// Poppins, Playfair Display + Lato. They are the fastest tell of a generated site.
export const FONT_PAIRS: readonly FontPair[] = [
  { id: 'fraunces-instrument', display: { family: 'Fraunces', axes: ['opsz', 'SOFT'] }, body: { family: 'Instrument Sans' }, fits: ['editorial', 'organic', 'craft'], note: 'soft optical serif, warm and contemporary' },
  { id: 'newsreader-hanken', display: { family: 'Newsreader', axes: ['opsz'], italic: true }, body: { family: 'Hanken Grotesk' }, fits: ['editorial', 'magazine', 'institutional'], note: 'news serif with a neutral grotesk' },
  { id: 'instrument-serif-geist', display: { family: 'Instrument Serif', weights: ['400'], italic: true }, body: { family: 'Geist' }, fits: ['editorial', 'architectural', 'luxury'], note: 'condensed display serif, quiet sans' },
  { id: 'bodoni-figtree', display: { family: 'Bodoni Moda', axes: ['opsz'], italic: true }, body: { family: 'Figtree' }, fits: ['luxury', 'magazine'], note: 'high-contrast didone, fashion register' },
  { id: 'cormorant-manrope', display: { family: 'Cormorant Garamond', italic: true }, body: { family: 'Manrope' }, fits: ['luxury', 'organic', 'architectural'], note: 'airy garalde for calm, premium pages' },
  { id: 'gloock-onest', display: { family: 'Gloock', weights: ['400'] }, body: { family: 'Onest' }, fits: ['retro-print', 'editorial', 'kinetic-type'], note: 'heavy contrasty serif, poster energy' },
  { id: 'young-serif-public', display: { family: 'Young Serif', weights: ['400'] }, body: { family: 'Public Sans' }, fits: ['craft', 'retro-print', 'organic'], note: 'friendly old-style serif, honest sans' },
  { id: 'caslon-franklin', display: { family: 'Libre Caslon Display', weights: ['400'] }, body: { family: 'Libre Franklin' }, fits: ['institutional', 'editorial', 'luxury'], note: 'classic American pairing, trustworthy' },
  { id: 'source-serif-plex', display: { family: 'Source Serif 4', axes: ['opsz'] }, body: { family: 'IBM Plex Sans' }, mono: { family: 'IBM Plex Mono', weights: ['400', '500'] }, fits: ['institutional', 'tech-noir', 'editorial'], note: 'serious, technical, legible' },
  { id: 'spectral-work', display: { family: 'Spectral', weights: ['300', '500'], italic: true }, body: { family: 'Work Sans' }, fits: ['institutional', 'craft', 'architectural'], note: 'screen-first serif, calm and precise' },
  { id: 'garamond-schibsted', display: { family: 'EB Garamond', italic: true }, body: { family: 'Schibsted Grotesk' }, fits: ['craft', 'editorial', 'institutional'], note: 'literary garamond, sturdy grotesk' },
  { id: 'space-grotesk-work', display: { family: 'Space Grotesk' }, body: { family: 'Work Sans' }, mono: { family: 'Space Mono', weights: ['400'] }, fits: ['tech-noir', 'swiss', 'brutalist'], note: 'quirky grotesk with a mono sibling' },
  { id: 'bricolage-familjen', display: { family: 'Bricolage Grotesque', axes: ['opsz', 'wdth'] }, body: { family: 'Familjen Grotesk' }, fits: ['playful', 'kinetic-type', 'magazine'], note: 'expressive variable grotesk' },
  { id: 'syne-manrope', display: { family: 'Syne' }, body: { family: 'Manrope' }, fits: ['kinetic-type', 'playful', 'architectural'], note: 'wide, art-school display' },
  { id: 'unbounded-onest', display: { family: 'Unbounded' }, body: { family: 'Onest' }, fits: ['playful', 'kinetic-type', 'tech-noir'], note: 'extended rounded display, loud and modern' },
  { id: 'anton-franklin', display: { family: 'Anton', weights: ['400'] }, body: { family: 'Libre Franklin' }, fits: ['magazine', 'kinetic-type', 'brutalist'], note: 'condensed impact headlines' },
  { id: 'bebas-figtree', display: { family: 'Bebas Neue', weights: ['400'] }, body: { family: 'Figtree' }, fits: ['magazine', 'brutalist', 'kinetic-type'], note: 'all-caps condensed display, sporty' },
  { id: 'archivo-black-chivo', display: { family: 'Archivo Black', weights: ['400'] }, body: { family: 'Chivo' }, mono: { family: 'Chivo Mono' }, fits: ['brutalist', 'swiss', 'magazine'], note: 'blunt heavy grotesk, industrial' },
  { id: 'archivo-wide', display: { family: 'Archivo', axes: ['wdth'] }, body: { family: 'Archivo', axes: ['wdth'] }, fits: ['swiss', 'institutional', 'architectural'], note: 'one family, two widths: expanded headlines, normal body' },
  { id: 'familjen-public', display: { family: 'Familjen Grotesk' }, body: { family: 'Public Sans' }, fits: ['swiss', 'institutional', 'minimal-mono'], note: 'rational grotesk system' },
  { id: 'jetbrains-geist', display: { family: 'JetBrains Mono' }, body: { family: 'Geist' }, mono: { family: 'JetBrains Mono' }, fits: ['tech-noir', 'minimal-mono', 'brutalist'], note: 'mono-led developer aesthetic' },
  { id: 'space-mono-work', display: { family: 'Space Mono', weights: ['400', '700'] }, body: { family: 'Work Sans' }, mono: { family: 'Space Mono', weights: ['400'] }, fits: ['retro-print', 'brutalist', 'minimal-mono'], note: 'retro typewriter mono' },
  { id: 'plex-mono-plex', display: { family: 'IBM Plex Mono', weights: ['400', '600'] }, body: { family: 'IBM Plex Sans' }, mono: { family: 'IBM Plex Mono', weights: ['400'] }, fits: ['minimal-mono', 'tech-noir', 'institutional'], note: 'engineered superfamily' },
  { id: 'dm-mono-dm-sans', display: { family: 'DM Mono', weights: ['400', '500'] }, body: { family: 'DM Sans', axes: ['opsz'] }, mono: { family: 'DM Mono', weights: ['400'] }, fits: ['minimal-mono', 'swiss', 'architectural'], note: 'soft mono with geometric body' },
  { id: 'fredoka-nunito', display: { family: 'Fredoka', axes: ['wdth'] }, body: { family: 'Nunito' }, fits: ['playful', 'organic', 'craft'], note: 'rounded and friendly, family or kids' },
  { id: 'italiana-tenor', display: { family: 'Italiana', weights: ['400'] }, body: { family: 'Tenor Sans', weights: ['400'] }, fits: ['luxury', 'architectural', 'organic'], note: 'thin fashion display, spa and boutique' },
  { id: 'marcellus-lora', display: { family: 'Marcellus', weights: ['400'] }, body: { family: 'Lora' }, fits: ['organic', 'craft', 'luxury'], note: 'inscriptional caps with a bookish body' },
  { id: 'alegreya-pair', display: { family: 'Alegreya', italic: true }, body: { family: 'Alegreya Sans', weights: ['400', '500', '700'] }, fits: ['craft', 'organic', 'editorial'], note: 'calligraphic humanist superfamily' },
  { id: 'zilla-work', display: { family: 'Zilla Slab', weights: ['500', '700'] }, body: { family: 'Work Sans' }, fits: ['retro-print', 'craft', 'magazine'], note: 'slab with print character' },
  { id: 'bitter-public', display: { family: 'Bitter' }, body: { family: 'Public Sans' }, fits: ['institutional', 'retro-print', 'craft'], note: 'sturdy slab, civic and dependable' },
  { id: 'red-hat-pair', display: { family: 'Red Hat Display' }, body: { family: 'Red Hat Text' }, fits: ['playful', 'swiss', 'tech-noir'], note: 'open, friendly corporate superfamily' },
  { id: 'darker-manrope', display: { family: 'Darker Grotesque' }, body: { family: 'Manrope' }, fits: ['architectural', 'luxury', 'kinetic-type'], note: 'tall tight grotesk, fashion-architectural' },
  { id: 'sora-onest', display: { family: 'Sora' }, body: { family: 'Onest' }, fits: ['tech-noir', 'playful', 'swiss'], note: 'geometric tech, product register' },
  { id: 'crimson-hanken', display: { family: 'Crimson Pro', italic: true }, body: { family: 'Hanken Grotesk' }, fits: ['editorial', 'craft', 'organic'], note: 'book serif, literary calm' },
  { id: 'petrona-schibsted', display: { family: 'Petrona', italic: true }, body: { family: 'Schibsted Grotesk' }, fits: ['editorial', 'magazine', 'institutional'], note: 'robust text serif with presence' },
  { id: 'abril-work', display: { family: 'Abril Fatface', weights: ['400'] }, body: { family: 'Work Sans' }, fits: ['retro-print', 'magazine', 'kinetic-type'], note: 'fat-face poster headlines' },
  { id: 'funnel-pair', display: { family: 'Funnel Display' }, body: { family: 'Funnel Sans' }, fits: ['swiss', 'playful', 'architectural'], note: 'sharp contemporary superfamily' },
  { id: 'hedvig-pair', display: { family: 'Hedvig Letters Serif', axes: ['opsz'] }, body: { family: 'Hedvig Letters Sans', weights: ['400'] }, fits: ['editorial', 'minimal-mono', 'organic'], note: 'quiet Scandinavian serif and sans' },
  { id: 'mona-hubot', display: { family: 'Hubot Sans', axes: ['wdth'] }, body: { family: 'Mona Sans', axes: ['wdth'] }, fits: ['kinetic-type', 'tech-noir', 'swiss'], note: 'width-axis grotesks for kinetic headlines' },
  { id: 'dela-gothic-rubik', display: { family: 'Dela Gothic One', weights: ['400'] }, body: { family: 'Rubik' }, fits: ['brutalist', 'playful', 'kinetic-type'], note: 'blocky display, street poster' },
  { id: 'literata-host', display: { family: 'Literata', axes: ['opsz'], italic: true }, body: { family: 'Host Grotesk' }, fits: ['editorial', 'institutional', 'craft'], note: 'reading serif with a modern grotesk' },
  { id: 'gelasio-afacad', display: { family: 'Gelasio', italic: true }, body: { family: 'Afacad' }, fits: ['organic', 'luxury', 'craft'], note: 'warm transitional serif, soft sans' },
]

export function fontPair(id: string): FontPair {
  const pair = FONT_PAIRS.find((p) => p.id === id)
  if (!pair) throw new Error(`Unknown font pair: ${id}`)
  return pair
}

/** `next/font/google` export name for a family ("Source Serif 4" -> "Source_Serif_4"). */
export function fontImportName(family: string): string {
  return family.replace(/\s+/g, '_')
}
