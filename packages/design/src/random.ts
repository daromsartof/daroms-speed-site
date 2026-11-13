// Seeded randomness: the same seed and inputs always produce the same DNA.

/** FNV-1a 32-bit hash of a string. */
export function hashString(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export type Rng = () => number

/** mulberry32: small, fast, good enough for design picks. Returns floats in [0, 1). */
export function createRng(seed: string): Rng {
  let a = hashString(seed)
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick() on an empty list')
  return items[Math.floor(rng() * items.length)] as T
}

/** Weighted pick; weights <= 0 are never chosen unless all are <= 0. */
export function weightedPick<T>(rng: Rng, items: readonly T[], weight: (item: T) => number): T {
  const weights = items.map((item) => Math.max(0, weight(item)))
  const total = weights.reduce((sum, w) => sum + w, 0)
  if (total <= 0) return pick(rng, items)
  let roll = rng() * total
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i] as number
    if (roll <= 0) return items[i] as T
  }
  return items[items.length - 1] as T
}

export function between(rng: Rng, [min, max]: readonly [number, number]): number {
  return min + rng() * (max - min)
}
