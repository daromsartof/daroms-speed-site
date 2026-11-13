export type RateLimitResult = { success: boolean }
export type RateLimiter = { limit(key: string): Promise<RateLimitResult> }

/**
 * In-memory fixed window. Only for development and single-instance Node servers: it does not
 * share state across Workers isolates or serverless instances.
 */
export function memoryRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: {
  limit: number
  windowMs: number
  now?: () => number
}): RateLimiter {
  const hits = new Map<string, { count: number; reset: number }>()
  return {
    async limit(key) {
      const t = now()
      const entry = hits.get(key)
      if (!entry || entry.reset <= t) {
        hits.set(key, { count: 1, reset: t + windowMs })
        if (hits.size > 10_000) {
          for (const [k, v] of hits) if (v.reset <= t) hits.delete(k)
        }
        return { success: true }
      }
      entry.count += 1
      return { success: entry.count <= limit }
    },
  }
}

/** Cloudflare Workers Rate Limiting binding (`ratelimits` in wrangler.jsonc). */
export function cloudflareRateLimiter(binding: {
  limit(options: { key: string }): Promise<RateLimitResult>
}): RateLimiter {
  return { limit: (key) => binding.limit({ key }) }
}
