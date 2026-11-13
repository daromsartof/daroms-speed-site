import type {
  ArchetypeId,
  Density,
  Grid,
  Imagery,
  Mode,
  Motion,
  Radius,
  Rules,
  Texture,
  ThreeLevel,
  TypeScale,
} from './schema.ts'

type Range = readonly [number, number]

export type Archetype = {
  id: ArchetypeId
  label: string
  /** One-line design read for the agent. */
  read: string
  /** Mood words that pull a brief toward this archetype. */
  moods: readonly string[]
  modes: readonly Mode[]
  scales: readonly TypeScale[]
  grids: readonly Grid[]
  radii: readonly Radius[]
  rules: readonly Rules[]
  textures: readonly Texture[]
  densities: readonly Density[]
  imagery: readonly Imagery[]
  motions: readonly Motion[]
  three: readonly ThreeLevel[]
  /** Accent chroma and lightness ranges, neutral tint range. */
  accentChroma: Range
  accentLightness: Range
  neutralChroma: Range
  /** Do this, specific to the archetype (shown in CATALOG.md). */
  signature: string
  /** Never do this with this archetype. */
  avoid: string
}

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  editorial: {
    id: 'editorial', label: 'Editorial',
    read: 'a considered publication: big serif headlines, generous measure, asymmetric columns',
    moods: ['thoughtful', 'literary', 'calm', 'premium', 'story', 'journal', 'warm'],
    modes: ['light', 'light', 'dark'], scales: ['classic', 'dramatic'],
    grids: ['editorial-12', 'asymmetric', 'split'], radii: ['none', 'subtle'], rules: ['hairline'],
    textures: ['none', 'paper', 'grain'], densities: ['airy', 'balanced'],
    imagery: ['photo-documentary', 'photo-studio', 'type-only'], motions: ['subtle', 'expressive'],
    three: ['none', 'none', 'accent'], accentChroma: [0.08, 0.17], accentLightness: [0.45, 0.6], neutralChroma: [0.006, 0.02],
    signature: 'pull quotes, drop caps, captions under images, one oversized headline per page',
    avoid: 'card grids, icons in circles, centered everything',
  },
  swiss: {
    id: 'swiss', label: 'Swiss / International',
    read: 'rational grid, flush-left grotesk, one strong signal color, numbers and alignment do the talking',
    moods: ['rational', 'clean', 'precise', 'modern', 'structured', 'clear'],
    modes: ['light', 'light', 'dark'], scales: ['classic', 'dramatic'],
    grids: ['swiss', 'editorial-12', 'split'], radii: ['none'], rules: ['hairline', 'bold'],
    textures: ['none', 'grid-lines'], densities: ['balanced', 'dense'],
    imagery: ['photo-studio', 'type-only', 'abstract-shapes'], motions: ['none', 'subtle'],
    three: ['none'], accentChroma: [0.16, 0.24], accentLightness: [0.52, 0.62], neutralChroma: [0, 0.006],
    signature: 'visible grid, large index numbers, strict baseline, a single red/blue/yellow accent',
    avoid: 'rounded pills, gradients, decorative serif',
  },
  brutalist: {
    id: 'brutalist', label: 'Brutalist',
    read: 'raw and confident: heavy type, thick borders, system-like layout, high contrast',
    moods: ['raw', 'bold', 'loud', 'honest', 'underground', 'unconventional', 'street'],
    modes: ['light', 'dark'], scales: ['dramatic', 'tight'],
    grids: ['swiss', 'bento', 'fullbleed'], radii: ['none'], rules: ['bold'],
    textures: ['none', 'halftone', 'grid-lines'], densities: ['dense', 'balanced'],
    imagery: ['photo-documentary', 'type-only', 'abstract-shapes'], motions: ['none', 'expressive'],
    three: ['none', 'accent'], accentChroma: [0.18, 0.3], accentLightness: [0.6, 0.85], neutralChroma: [0, 0.004],
    signature: 'thick black rules, marquee text, exposed structure, offset hard shadows',
    avoid: 'soft shadows, pastel gradients, delicate serif',
  },
  luxury: {
    id: 'luxury', label: 'Luxury',
    read: 'restraint and space: high-contrast serif, slow reveals, a muted precious accent',
    moods: ['luxurious', 'premium', 'elegant', 'exclusive', 'refined', 'timeless', 'high-end'],
    modes: ['dark', 'light'], scales: ['dramatic', 'classic'],
    grids: ['centered', 'asymmetric', 'fullbleed'], radii: ['none'], rules: ['hairline', 'none'],
    textures: ['none', 'grain'], densities: ['airy'],
    imagery: ['photo-studio', 'photo-documentary'], motions: ['cinematic', 'subtle'],
    three: ['none', 'accent', 'hero'], accentChroma: [0.04, 0.1], accentLightness: [0.6, 0.78], neutralChroma: [0.004, 0.015],
    signature: 'huge whitespace, letter-spaced small caps, full-bleed imagery, slow fades',
    avoid: 'bright saturated accents, dense copy, bouncy motion',
  },
  organic: {
    id: 'organic', label: 'Organic',
    read: 'natural and tactile: earthy palette, soft shapes, paper texture, unhurried rhythm',
    moods: ['natural', 'warm', 'calm', 'healthy', 'sustainable', 'gentle', 'earthy', 'wellness'],
    modes: ['light'], scales: ['classic'],
    grids: ['asymmetric', 'split', 'centered'], radii: ['soft', 'pill'], rules: ['none', 'hairline'],
    textures: ['paper', 'grain', 'none'], densities: ['airy', 'balanced'],
    imagery: ['photo-documentary', 'illustration'], motions: ['subtle'],
    three: ['none', 'accent'], accentChroma: [0.06, 0.13], accentLightness: [0.48, 0.62], neutralChroma: [0.01, 0.025],
    signature: 'organic blob crops, hand-drawn underline, warm off-white surfaces',
    avoid: 'neon, hard black, tech grids',
  },
  'tech-noir': {
    id: 'tech-noir', label: 'Tech noir',
    read: 'dark interface aesthetic: mono labels, fine grid lines, one luminous accent, product-first',
    moods: ['technical', 'developer', 'futuristic', 'precise', 'dark', 'ai', 'data', 'engineering'],
    modes: ['dark'], scales: ['tight', 'classic'],
    grids: ['bento', 'swiss', 'centered'], radii: ['subtle', 'soft'], rules: ['hairline'],
    textures: ['grid-lines', 'grain', 'none'], densities: ['balanced', 'dense'],
    imagery: ['3d-render', 'abstract-shapes', 'type-only'], motions: ['subtle', 'expressive'],
    three: ['accent', 'hero', 'immersive'], accentChroma: [0.12, 0.22], accentLightness: [0.7, 0.85], neutralChroma: [0.004, 0.015],
    signature: 'terminal-like labels, code snippets, live-looking UI fragments, subtle 3D',
    avoid: 'purple-to-pink gradients, glassmorphism cards, emoji',
  },
  playful: {
    id: 'playful', label: 'Playful',
    read: 'cheerful and bold: rounded type, saturated colors, stickers and bouncy motion',
    moods: ['fun', 'playful', 'friendly', 'young', 'colorful', 'kids', 'energetic', 'happy'],
    modes: ['light'], scales: ['dramatic', 'classic'],
    grids: ['bento', 'asymmetric', 'centered'], radii: ['pill', 'soft'], rules: ['none', 'bold'],
    textures: ['none', 'halftone'], densities: ['balanced'],
    imagery: ['illustration', 'abstract-shapes', 'photo-studio'], motions: ['expressive'],
    three: ['none', 'accent', 'hero'], accentChroma: [0.17, 0.26], accentLightness: [0.6, 0.75], neutralChroma: [0.005, 0.02],
    signature: 'sticker-like badges, tilted cards, color-blocked sections, springy hovers',
    avoid: 'thin serif, grey-on-grey, corporate stock photos',
  },
  'retro-print': {
    id: 'retro-print', label: 'Retro print',
    read: 'printed-matter nostalgia: slab and fat-face type, halftone, warm inks on cream',
    moods: ['retro', 'vintage', 'nostalgic', 'print', 'classic', 'heritage', 'diner'],
    modes: ['light'], scales: ['dramatic', 'classic'],
    grids: ['centered', 'editorial-12', 'bento'], radii: ['none', 'subtle'], rules: ['bold', 'hairline'],
    textures: ['halftone', 'paper', 'grain'], densities: ['balanced', 'dense'],
    imagery: ['illustration', 'photo-documentary'], motions: ['subtle', 'none'],
    three: ['none'], accentChroma: [0.12, 0.2], accentLightness: [0.5, 0.62], neutralChroma: [0.015, 0.03],
    signature: 'badges and stamps, two-ink color scheme, misregistered offsets',
    avoid: 'glossy gradients, thin geometric sans',
  },
  'minimal-mono': {
    id: 'minimal-mono', label: 'Minimal mono',
    read: 'almost nothing: monospace-led, monochrome, one tiny accent, content as structure',
    moods: ['minimal', 'quiet', 'simple', 'focused', 'essential', 'monochrome'],
    modes: ['light', 'dark'], scales: ['tight'],
    grids: ['centered', 'swiss'], radii: ['none', 'subtle'], rules: ['hairline'],
    textures: ['none'], densities: ['airy', 'balanced'],
    imagery: ['type-only', 'photo-studio'], motions: ['none', 'subtle'],
    three: ['none'], accentChroma: [0.1, 0.2], accentLightness: [0.5, 0.65], neutralChroma: [0, 0.005],
    signature: 'plain-text lists, timestamps, keyboard-like links, generous line height',
    avoid: 'hero images, decorative illustration, more than one accent',
  },
  magazine: {
    id: 'magazine', label: 'Magazine',
    read: 'newsstand energy: condensed display, dense multi-column layout, big numbers and covers',
    moods: ['bold', 'news', 'sport', 'culture', 'energetic', 'urban', 'event'],
    modes: ['light', 'dark'], scales: ['dramatic'],
    grids: ['editorial-12', 'bento', 'fullbleed'], radii: ['none'], rules: ['bold', 'hairline'],
    textures: ['none', 'grain'], densities: ['dense'],
    imagery: ['photo-documentary', 'photo-studio'], motions: ['expressive', 'subtle'],
    three: ['none', 'accent'], accentChroma: [0.18, 0.26], accentLightness: [0.5, 0.62], neutralChroma: [0, 0.008],
    signature: 'cover-style hero, issue numbers, kicker labels, tight leading headlines',
    avoid: 'empty minimalism, pastel palettes',
  },
  architectural: {
    id: 'architectural', label: 'Architectural',
    read: 'space and proportion: thin type, wide margins, full-bleed photography, slow motion',
    moods: ['architectural', 'spatial', 'calm', 'precise', 'design', 'interior', 'real-estate'],
    modes: ['light', 'dark'], scales: ['classic', 'dramatic'],
    grids: ['fullbleed', 'asymmetric', 'swiss'], radii: ['none'], rules: ['hairline', 'none'],
    textures: ['none'], densities: ['airy'],
    imagery: ['photo-studio', 'photo-documentary', '3d-render'], motions: ['cinematic', 'subtle'],
    three: ['none', 'accent', 'hero'], accentChroma: [0.02, 0.08], accentLightness: [0.45, 0.65], neutralChroma: [0, 0.01],
    signature: 'plan-like line drawings, image sequences, coordinates and dimensions as details',
    avoid: 'bright accents, illustration, playful motion',
  },
  'kinetic-type': {
    id: 'kinetic-type', label: 'Kinetic type',
    read: 'typography as image: oversized moving headlines, variable fonts, scroll-driven motion',
    moods: ['dynamic', 'creative', 'agency', 'bold', 'experimental', 'music', 'motion'],
    modes: ['dark', 'light'], scales: ['dramatic'],
    grids: ['fullbleed', 'asymmetric', 'centered'], radii: ['none', 'pill'], rules: ['none', 'hairline'],
    textures: ['none', 'grain', 'mesh'], densities: ['airy', 'balanced'],
    imagery: ['type-only', 'abstract-shapes', '3d-render'], motions: ['expressive', 'cinematic'],
    three: ['accent', 'hero', 'immersive'], accentChroma: [0.15, 0.27], accentLightness: [0.6, 0.85], neutralChroma: [0, 0.01],
    signature: 'viewport-wide words, variable weight on scroll, marquees, split-letter reveals',
    avoid: 'static stock imagery, small timid headlines',
  },
  craft: {
    id: 'craft', label: 'Craft',
    read: 'made by hand: documentary photos, warm serif, process stories, tactile details',
    moods: ['handmade', 'artisan', 'local', 'authentic', 'family', 'bakery', 'workshop', 'warm'],
    modes: ['light'], scales: ['classic'],
    grids: ['asymmetric', 'split', 'editorial-12'], radii: ['subtle', 'soft'], rules: ['hairline'],
    textures: ['paper', 'grain'], densities: ['balanced'],
    imagery: ['photo-documentary', 'illustration'], motions: ['subtle'],
    three: ['none'], accentChroma: [0.08, 0.15], accentLightness: [0.45, 0.58], neutralChroma: [0.012, 0.028],
    signature: 'process timelines with real photos, handwritten notes, maker portraits',
    avoid: 'stock photos of smiling people, glossy UI',
  },
  institutional: {
    id: 'institutional', label: 'Institutional',
    read: 'quiet authority: classic serif, deep sober color, clear hierarchy, proof over promises',
    moods: ['trustworthy', 'serious', 'professional', 'legal', 'finance', 'medical', 'established', 'reliable'],
    modes: ['light'], scales: ['classic', 'tight'],
    grids: ['editorial-12', 'split', 'centered'], radii: ['none', 'subtle'], rules: ['hairline'],
    textures: ['none'], densities: ['balanced'],
    imagery: ['photo-documentary', 'photo-studio', 'type-only'], motions: ['none', 'subtle'],
    three: ['none'], accentChroma: [0.06, 0.13], accentLightness: [0.32, 0.48], neutralChroma: [0.004, 0.014],
    signature: 'credentials and figures up front, named people, precise service lists',
    avoid: 'handshake stock photos, gavel icons, vague superlatives',
  },
}

export const ARCHETYPE_LIST = Object.values(ARCHETYPES)
