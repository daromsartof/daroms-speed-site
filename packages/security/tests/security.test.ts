import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { buildCsp, CSP_PRESETS, mergeCspSources, securityHeaders } from '../src/headers.ts'
import { memoryRateLimiter } from '../src/rate-limit.ts'
import { verifyTurnstile } from '../src/turnstile.ts'
import { defineEnv } from '../src/env.ts'
import { clientIp } from '../src/ip.ts'

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'cf-connecting-ip': '203.0.113.7' }),
}))

describe('CSP', () => {
  it('is strict by default and static-friendly', () => {
    const csp = buildCsp()
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("script-src 'self' 'unsafe-inline'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("frame-src 'none'")
    expect(csp).not.toContain('unsafe-eval')
    expect(csp).toContain('upgrade-insecure-requests')
  })

  it('adds dev-only allowances', () => {
    const csp = buildCsp({ dev: true })
    expect(csp).toContain("'unsafe-eval'")
    expect(csp).toContain('ws:')
    expect(csp).not.toContain('upgrade-insecure-requests')
  })

  it('merges presets without duplicates', () => {
    const csp = buildCsp(
      mergeCspSources(CSP_PRESETS.turnstile, CSP_PRESETS.turnstile, CSP_PRESETS.plausible),
    )
    expect(csp).toContain('frame-src https://challenges.cloudflare.com')
    expect(csp.match(/challenges\.cloudflare\.com/g)).toHaveLength(2)
    expect(csp).toContain("connect-src 'self' https://plausible.io")
  })

  it('emits the security header set', () => {
    const keys = securityHeaders({ csp: buildCsp() }).map((h) => h.key)
    expect(keys).toEqual(
      expect.arrayContaining([
        'Content-Security-Policy',
        'Strict-Transport-Security',
        'X-Frame-Options',
        'Referrer-Policy',
        'Permissions-Policy',
      ]),
    )
    expect(securityHeaders({ csp: '', hsts: false }).map((h) => h.key)).not.toContain(
      'Strict-Transport-Security',
    )
  })
})

describe('rate limit', () => {
  it('blocks after the limit and resets after the window', async () => {
    let t = 0
    const rl = memoryRateLimiter({ limit: 2, windowMs: 1000, now: () => t })
    expect((await rl.limit('a')).success).toBe(true)
    expect((await rl.limit('a')).success).toBe(true)
    expect((await rl.limit('a')).success).toBe(false)
    expect((await rl.limit('b')).success).toBe(true)
    t = 1001
    expect((await rl.limit('a')).success).toBe(true)
  })
})

describe('turnstile', () => {
  it('rejects a missing token without a network call', async () => {
    const fetchFn = vi.fn()
    expect(await verifyTurnstile('', { secret: 's', fetchFn })).toEqual({
      success: false,
      errors: ['missing-input-response'],
    })
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('reports the verification result', async () => {
    const fetchFn = vi.fn(
      async () => new Response(JSON.stringify({ success: true })),
    ) as unknown as typeof fetch
    expect((await verifyTurnstile('tok', { secret: 's', fetchFn })).success).toBe(true)
  })

  it('fails closed when the request fails', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('offline')
    }) as unknown as typeof fetch
    expect(await verifyTurnstile('tok', { secret: 's', fetchFn })).toEqual({
      success: false,
      errors: ['verify-request-failed'],
    })
  })
})

describe('env', () => {
  it('validates lazily and never prints values', () => {
    const env = defineEnv({ API_KEY: z.string().min(1), PORT: z.coerce.number() }, () => ({
      API_KEY: 'secret-value',
    }))
    expect(() => env.API_KEY).toThrow(/PORT/)
    expect(() => env.API_KEY).not.toThrow(/secret-value/)
  })

  it('returns parsed values', () => {
    const env = defineEnv({ PORT: z.coerce.number() }, () => ({ PORT: '3000' }))
    expect(env.PORT).toBe(3000)
  })
})

describe('clientIp', () => {
  it('prefers Cloudflare, then x-forwarded-for', () => {
    expect(
      clientIp(new Headers({ 'cf-connecting-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' })),
    ).toBe('1.1.1.1')
    expect(clientIp(new Headers({ 'x-forwarded-for': '2.2.2.2, 3.3.3.3' }))).toBe('2.2.2.2')
    expect(clientIp(new Headers())).toBe('unknown')
  })
})

describe('safeAction', async () => {
  const { safeAction } = await import('../src/action.ts')
  const schema = z.object({ email: z.email(), message: z.string().min(5) })
  const form = (data: Record<string, string>) => {
    const fd = new FormData()
    for (const [k, v] of Object.entries(data)) fd.set(k, v)
    return fd
  }

  it('validates and returns field errors', async () => {
    const action = safeAction(schema, async () => 'sent')
    const result = await action(null, form({ email: 'nope', message: 'hi' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(Object.keys(result.fieldErrors ?? {})).toEqual(['email', 'message'])
  })

  it('passes clean input and the client IP to the handler', async () => {
    const handler = vi.fn(
      async (input: z.infer<typeof schema>, ctx: { ip: string }) => `${input.email}:${ctx.ip}`,
    )
    const result = await safeAction(schema, handler)(
      null,
      form({ email: 'a@b.co', message: 'hello there' }),
    )
    expect(result).toEqual({ ok: true, data: 'a@b.co:203.0.113.7' })
  })

  it('drops honeypot submissions', async () => {
    const handler = vi.fn(async () => 'sent')
    const result = await safeAction(schema, handler)(
      null,
      form({ email: 'a@b.co', message: 'hello there', company_website: 'x' }),
    )
    expect(result.ok).toBe(false)
    expect(handler).not.toHaveBeenCalled()
  })

  it('rate limits per IP', async () => {
    const action = safeAction(schema, async () => 'sent', {
      rateLimiter: memoryRateLimiter({ limit: 1, windowMs: 60_000 }),
    })
    const data = { email: 'a@b.co', message: 'hello there' }
    expect((await action(null, form(data))).ok).toBe(true)
    expect((await action(null, form(data))).ok).toBe(false)
  })

  it('hides handler errors', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await safeAction(schema, async () => {
      throw new Error('db password wrong')
    })(null, form({ email: 'a@b.co', message: 'hello there' }))
    expect(result).toEqual({ ok: false, error: expect.not.stringContaining('password') })
    spy.mockRestore()
  })
})
