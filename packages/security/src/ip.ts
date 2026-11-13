type HeaderReader = { get(name: string): string | null }

/** Best-effort client IP behind Cloudflare, Vercel or a reverse proxy. */
export function clientIp(headers: HeaderReader): string {
  const direct = headers.get('cf-connecting-ip') ?? headers.get('x-real-ip')
  if (direct) return direct.trim()
  const forwarded = headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}
