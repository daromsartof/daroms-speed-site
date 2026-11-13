import { describe, expect, it } from 'vitest'
import { defineManifest, withDss } from '../src/config.ts'

const base = {
  name: 'Atelier Nord',
  url: 'https://ateliernord.example',
  pages: [{ route: '/', name: 'home' }],
}

describe('defineManifest', () => {
  it('fills defaults', () => {
    const m = defineManifest(base)
    expect(m.deploy).toEqual({ target: 'cloudflare', cache: 'static' })
    expect(m.db.driver).toBe('none')
    expect(m.seo).toMatchObject({ trailingSlash: false, llmsTxt: true, aiCrawlers: 'allow' })
    expect(m.security.csp.scriptSrc).toEqual([])
    expect(m.pages[0]).toMatchObject({ sections: [], nav: true, noindex: false })
  })

  it('rejects bad input with readable paths', () => {
    expect(() => defineManifest({ ...base, url: 'https://x.example/' })).toThrow(/url/)
    expect(() => defineManifest({ ...base, pages: [{ route: 'about', name: 'about' }] })).toThrow(
      /pages\.0\.route/,
    )
    expect(() =>
      defineManifest({
        ...base,
        pages: [
          { route: '/', name: 'a' },
          { route: '/', name: 'b' },
        ],
      }),
    ).toThrow(/duplicate route/)
  })
})

describe('withDss', () => {
  const env = { NODE_ENV: 'production' }

  it('sets secure defaults', async () => {
    const config = withDss(defineManifest(base), {}, { env })
    expect(config.poweredByHeader).toBe(false)
    expect(config.typedRoutes).toBe(true)
    expect(config.output).toBeUndefined()
    const [rule] = (await config.headers?.()) ?? []
    const csp = rule?.headers.find((h) => h.key === 'Content-Security-Policy')?.value
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).not.toContain('unsafe-eval')
    expect(rule?.headers.some((h) => h.key === 'Strict-Transport-Security')).toBe(true)
  })

  it('adds CSP presets, extra sources and module sources', async () => {
    const m = defineManifest({
      ...base,
      security: { csp: { presets: ['turnstile'], imgSrc: ['https://images.example'] } },
    })
    const config = withDss(m, {}, { env, moduleCsp: [{ connectSrc: ['https://plausible.io'] }] })
    const csp = (await config.headers?.())?.[0]?.headers.find(
      (h) => h.key === 'Content-Security-Policy',
    )?.value
    expect(csp).toContain('https://challenges.cloudflare.com')
    expect(csp).toContain("img-src 'self' blob: data: https://images.example")
    expect(csp).toContain('https://plausible.io')
  })

  it('rejects unknown presets and nonce with cacheComponents', () => {
    expect(() =>
      withDss(defineManifest({ ...base, security: { csp: { presets: ['nope'] } } }), {}, { env }),
    ).toThrow(/nope/)
    expect(() =>
      withDss(
        defineManifest({ ...base, cacheComponents: true, security: { nonce: true } }),
        {},
        { env },
      ),
    ).toThrow(/incompatible/)
  })

  it('builds standalone output for docker and merges redirects', async () => {
    const m = defineManifest({
      ...base,
      deploy: { target: 'docker' },
      redirects: [{ from: '/old', to: '/' }],
    })
    const config = withDss(
      m,
      { redirects: async () => [{ source: '/a', destination: '/b', permanent: false }] },
      { env },
    )
    expect(config.output).toBe('standalone')
    expect(await config.redirects?.()).toEqual([
      { source: '/old', destination: '/', permanent: true },
      { source: '/a', destination: '/b', permanent: false },
    ])
  })

  it('relaxes CSP and HSTS in development', async () => {
    const config = withDss(defineManifest(base), {}, { env: { NODE_ENV: 'development' } })
    const headers = (await config.headers?.())?.[0]?.headers ?? []
    expect(headers.find((h) => h.key === 'Content-Security-Policy')?.value).toContain(
      "'unsafe-eval'",
    )
    expect(headers.some((h) => h.key === 'Strict-Transport-Security')).toBe(false)
  })
})

describe('manifest input', () => {
  it('keeps the raw input for the CLI, hidden from enumeration', async () => {
    const { MANIFEST_INPUT } = await import('../src/config.ts')
    const m = defineManifest(base)
    expect((m as unknown as Record<symbol, unknown>)[MANIFEST_INPUT]).toBe(base)
    expect(Object.keys(m)).not.toContain(String(MANIFEST_INPUT))
    expect(JSON.stringify(m)).not.toContain('input')
  })
})
