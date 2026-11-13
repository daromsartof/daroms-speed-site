import type { ArchetypeId } from './schema.ts'

type HueRange = readonly [number, number]

export type Industry = {
  id: string
  /** Words in a brief that map to this industry (English and French). */
  keywords: readonly string[]
  /** Archetype affinity, 0 (never) to 3 (natural fit). Missing = 1. */
  affinity: Partial<Record<ArchetypeId, number>>
  /** Preferred accent hue ranges (OKLCH degrees). Empty = anything goes. */
  hues: readonly HueRange[]
}

// prettier-ignore
export const INDUSTRIES: readonly Industry[] = [
  { id: 'restaurant', keywords: ['restaurant', 'bistro', 'brasserie', 'food', 'chef', 'dining', 'cuisine'], affinity: { editorial: 3, craft: 3, 'retro-print': 2, luxury: 2, magazine: 2, organic: 2, 'tech-noir': 0, 'minimal-mono': 0 }, hues: [[20, 70], [120, 155], [345, 360]] },
  { id: 'cafe-bakery', keywords: ['cafe', 'coffee', 'bakery', 'boulangerie', 'patisserie', 'cake', 'tea'], affinity: { craft: 3, 'retro-print': 3, organic: 2, playful: 2, editorial: 2, 'tech-noir': 0, institutional: 0 }, hues: [[25, 75], [140, 170]] },
  { id: 'hotel-hospitality', keywords: ['hotel', 'resort', 'guesthouse', 'lodge', 'villa', 'bnb', 'hospitality'], affinity: { luxury: 3, architectural: 3, organic: 2, editorial: 2, brutalist: 0, playful: 1 }, hues: [[30, 90], [150, 210]] },
  { id: 'legal', keywords: ['law', 'lawyer', 'attorney', 'legal', 'avocat', 'notary', 'notaire'], affinity: { institutional: 3, editorial: 2, swiss: 2, luxury: 1, playful: 0, brutalist: 0, 'kinetic-type': 0 }, hues: [[225, 265], [150, 175], [15, 35]] },
  { id: 'finance', keywords: ['finance', 'bank', 'accounting', 'comptable', 'insurance', 'wealth', 'investment', 'fintech'], affinity: { institutional: 3, swiss: 3, 'tech-noir': 2, editorial: 1, playful: 0, 'retro-print': 0 }, hues: [[220, 260], [150, 185], [60, 95]] },
  { id: 'consulting', keywords: ['consulting', 'consultant', 'advisory', 'coach', 'strategy', 'conseil'], affinity: { editorial: 3, swiss: 3, institutional: 2, architectural: 2, 'minimal-mono': 2, playful: 0 }, hues: [] },
  { id: 'saas', keywords: ['saas', 'software', 'app', 'platform', 'api', 'startup', 'product', 'ai', 'tool'], affinity: { 'tech-noir': 3, swiss: 3, 'minimal-mono': 2, playful: 2, 'kinetic-type': 2, craft: 0, 'retro-print': 0 }, hues: [] },
  { id: 'agency', keywords: ['agency', 'studio', 'creative', 'design', 'branding', 'agence', 'marketing'], affinity: { 'kinetic-type': 3, brutalist: 3, editorial: 2, swiss: 2, magazine: 2, institutional: 0 }, hues: [] },
  { id: 'architecture', keywords: ['architect', 'architecture', 'interior', 'construction', 'builder', 'renovation', 'btp'], affinity: { architectural: 3, swiss: 3, 'minimal-mono': 2, brutalist: 2, playful: 0 }, hues: [[25, 70], [200, 240]] },
  { id: 'real-estate', keywords: ['real estate', 'property', 'immobilier', 'realtor', 'apartment', 'rental'], affinity: { architectural: 3, luxury: 2, editorial: 2, institutional: 2, playful: 0, brutalist: 0 }, hues: [[30, 80], [180, 240]] },
  { id: 'health', keywords: ['clinic', 'doctor', 'medical', 'dentist', 'health', 'therapy', 'physio', 'sante', 'cabinet'], affinity: { institutional: 3, organic: 3, swiss: 2, editorial: 1, brutalist: 0, 'kinetic-type': 0 }, hues: [[160, 215], [120, 160]] },
  { id: 'wellness', keywords: ['spa', 'yoga', 'wellness', 'massage', 'beauty', 'salon', 'skincare', 'meditation'], affinity: { organic: 3, luxury: 3, editorial: 2, craft: 2, brutalist: 0, 'tech-noir': 0 }, hues: [[60, 150], [20, 50], [300, 350]] },
  { id: 'fitness', keywords: ['gym', 'fitness', 'sport', 'training', 'crossfit', 'club', 'athlete'], affinity: { magazine: 3, brutalist: 3, 'kinetic-type': 3, playful: 2, luxury: 1, organic: 1 }, hues: [[20, 50], [90, 140], [0, 20]] },
  { id: 'fashion', keywords: ['fashion', 'clothing', 'boutique', 'apparel', 'mode', 'jewelry', 'bijoux'], affinity: { luxury: 3, magazine: 3, 'kinetic-type': 2, brutalist: 2, editorial: 2, institutional: 0 }, hues: [] },
  { id: 'artisan', keywords: ['artisan', 'handmade', 'workshop', 'atelier', 'furniture', 'ceramic', 'craft', 'woodwork'], affinity: { craft: 3, organic: 3, editorial: 2, 'retro-print': 2, 'tech-noir': 0 }, hues: [[20, 70], [100, 160]] },
  { id: 'education', keywords: ['school', 'course', 'training', 'education', 'academy', 'formation', 'tutor', 'university'], affinity: { playful: 3, editorial: 2, institutional: 2, swiss: 2, luxury: 0 }, hues: [] },
  { id: 'nonprofit', keywords: ['nonprofit', 'charity', 'association', 'ngo', 'foundation', 'ong', 'community'], affinity: { editorial: 3, craft: 2, organic: 2, magazine: 2, luxury: 0 }, hues: [] },
  { id: 'portfolio', keywords: ['portfolio', 'photographer', 'illustrator', 'artist', 'freelance', 'designer', 'developer'], affinity: { 'minimal-mono': 3, 'kinetic-type': 3, editorial: 2, brutalist: 2, swiss: 2, institutional: 0 }, hues: [] },
  { id: 'event', keywords: ['event', 'festival', 'conference', 'wedding', 'concert', 'meetup', 'mariage'], affinity: { magazine: 3, 'kinetic-type': 3, playful: 2, luxury: 2, 'retro-print': 2 }, hues: [] },
  { id: 'music', keywords: ['music', 'band', 'label', 'dj', 'record', 'artist', 'musique'], affinity: { 'kinetic-type': 3, brutalist: 3, magazine: 2, 'retro-print': 2, institutional: 0 }, hues: [] },
  { id: 'tourism', keywords: ['travel', 'tour', 'tourism', 'safari', 'excursion', 'voyage', 'guide', 'island'], affinity: { editorial: 3, organic: 2, luxury: 2, magazine: 2, 'tech-noir': 0 }, hues: [[150, 220], [30, 80]] },
  { id: 'ecommerce', keywords: ['shop', 'store', 'ecommerce', 'boutique en ligne', 'products', 'brand'], affinity: { playful: 2, editorial: 2, swiss: 2, luxury: 2, magazine: 2 }, hues: [] },
  { id: 'general', keywords: [], affinity: {}, hues: [] },
]

/** Finds the industry for a free-text brief or id. Falls back to `general`. */
export function matchIndustry(input: string | undefined): Industry {
  const general = INDUSTRIES[INDUSTRIES.length - 1] as Industry
  if (!input) return general
  const text = input.toLowerCase()
  const exact = INDUSTRIES.find((i) => i.id === text)
  if (exact) return exact
  let best = general
  let bestScore = 0
  for (const industry of INDUSTRIES) {
    const score = industry.keywords.filter((k) => text.includes(k)).length
    if (score > bestScore) {
      best = industry
      bestScore = score
    }
  }
  return best
}
