// Node-safe: imported by next.config.ts through @dss/site. No JSX, explicit .ts imports only.

export type CspSources = {
  scriptSrc?: readonly string[]
  styleSrc?: readonly string[]
  imgSrc?: readonly string[]
  fontSrc?: readonly string[]
  connectSrc?: readonly string[]
  frameSrc?: readonly string[]
  mediaSrc?: readonly string[]
  workerSrc?: readonly string[]
  formAction?: readonly string[]
}

export type CspOptions = CspSources & {
  /** Development adds 'unsafe-eval' (React dev tooling) and ws: for HMR. */
  dev?: boolean
  /** Who may embed the site. Default: nobody. */
  frameAncestors?: readonly string[]
}

const uniq = (values: readonly string[]) => [...new Set(values)]

/**
 * Static Content-Security-Policy. Pages stay static and cacheable; inline scripts emitted by
 * Next.js need 'unsafe-inline' without a nonce. A nonce CSP forces dynamic rendering of every
 * page (see the csp-nonce rule).
 */
export function buildCsp(options: CspOptions = {}): string {
  const dev = options.dev ?? false
  const directives: [string, readonly string[]][] = [
    ['default-src', ["'self'"]],
    [
      'script-src',
      [
        "'self'",
        "'unsafe-inline'",
        ...(dev ? ["'unsafe-eval'"] : []),
        ...(options.scriptSrc ?? []),
      ],
    ],
    ['style-src', ["'self'", "'unsafe-inline'", ...(options.styleSrc ?? [])]],
    ['img-src', ["'self'", 'blob:', 'data:', ...(options.imgSrc ?? [])]],
    ['font-src', ["'self'", ...(options.fontSrc ?? [])]],
    ['connect-src', ["'self'", ...(dev ? ['ws:'] : []), ...(options.connectSrc ?? [])]],
    ['media-src', ["'self'", ...(options.mediaSrc ?? [])]],
    ['worker-src', ["'self'", 'blob:', ...(options.workerSrc ?? [])]],
    ['frame-src', options.frameSrc?.length ? uniq(options.frameSrc) : ["'none'"]],
    ['object-src', ["'none'"]],
    ['base-uri', ["'self'"]],
    ['form-action', ["'self'", ...(options.formAction ?? [])]],
    ['frame-ancestors', options.frameAncestors?.length ? uniq(options.frameAncestors) : ["'none'"]],
  ]
  const parts = directives.map(([name, values]) => `${name} ${uniq(values).join(' ')}`)
  if (!dev) parts.push('upgrade-insecure-requests')
  return parts.join('; ')
}

/** Merges several source lists (site manifest + installed modules). */
export function mergeCspSources(...lists: readonly (CspSources | undefined)[]): CspSources {
  const out: Record<string, string[]> = {}
  for (const list of lists) {
    if (!list) continue
    for (const [key, values] of Object.entries(list)) {
      out[key] = uniq([...(out[key] ?? []), ...((values as readonly string[] | undefined) ?? [])])
    }
  }
  return out as CspSources
}

export type Header = { key: string; value: string }

export type SecurityHeaderOptions = {
  csp: string
  /** HSTS on by default; disable only for local http previews. */
  hsts?: boolean
}

/** Security headers applied to every route. */
export function securityHeaders({ csp, hsts = true }: SecurityHeaderOptions): Header[] {
  return [
    { key: 'Content-Security-Policy', value: csp },
    ...(hsts
      ? [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ]
      : []),
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=()',
    },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ]
}

/** Known third-party sources, so modules and the manifest reference names instead of URLs. */
export const CSP_PRESETS = {
  turnstile: {
    scriptSrc: ['https://challenges.cloudflare.com'],
    frameSrc: ['https://challenges.cloudflare.com'],
  },
  plausible: { scriptSrc: ['https://plausible.io'], connectSrc: ['https://plausible.io'] },
  umami: { scriptSrc: ['https://cloud.umami.is'], connectSrc: ['https://api-gateway.umami.dev'] },
  cloudflareAnalytics: {
    scriptSrc: ['https://static.cloudflareinsights.com'],
    connectSrc: ['https://cloudflareinsights.com'],
  },
  youtube: { frameSrc: ['https://www.youtube-nocookie.com'] },
  vimeo: { frameSrc: ['https://player.vimeo.com'] },
  calcom: {
    frameSrc: ['https://cal.com', 'https://app.cal.com'],
    scriptSrc: ['https://app.cal.com'],
  },
  googleMaps: { frameSrc: ['https://www.google.com'] },
  stripe: {
    scriptSrc: ['https://js.stripe.com'],
    frameSrc: ['https://js.stripe.com', 'https://hooks.stripe.com'],
    connectSrc: ['https://api.stripe.com'],
  },
} as const satisfies Record<string, CspSources>

export type CspPreset = keyof typeof CSP_PRESETS
