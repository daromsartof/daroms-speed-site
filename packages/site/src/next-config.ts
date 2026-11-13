import type { NextConfig } from 'next'
import {
  buildCsp,
  CSP_PRESETS,
  mergeCspSources,
  securityHeaders,
  type CspPreset,
  type CspSources,
} from '@dss/security/headers'
import type { Manifest } from './manifest.ts'

export type WithDssOptions = {
  /** CSP sources contributed by installed modules (from the generated registry). */
  moduleCsp?: readonly CspSources[]
  /** Overrides for tests; defaults read process.env. */
  env?: Record<string, string | undefined>
}

function manifestCsp(manifest: Manifest): CspSources {
  const { presets, ...sources } = manifest.security.csp
  const unknown = presets.filter((p) => !(p in CSP_PRESETS))
  if (unknown.length)
    throw new Error(`Unknown CSP preset(s) in site.manifest.ts: ${unknown.join(', ')}`)
  return mergeCspSources(...presets.map((p) => CSP_PRESETS[p as CspPreset]), sources)
}

/**
 * The Next.js config for a dss site, derived from site.manifest.ts. Pass project-specific
 * options as `config`; headers and redirects are merged, never replaced. Never adds a webpack()
 * hook: Turbopack builds fail with one.
 */
export function withDss(
  manifest: Manifest,
  config: NextConfig = {},
  options: WithDssOptions = {},
): NextConfig {
  const env = options.env ?? process.env
  if (manifest.security.nonce && manifest.cacheComponents) {
    throw new Error(
      'site.manifest.ts: security.nonce forces dynamic rendering and is incompatible with cacheComponents. Choose one.',
    )
  }
  const dev = env.NODE_ENV === 'development'
  const csp = buildCsp({
    dev,
    ...mergeCspSources(manifestCsp(manifest), ...(options.moduleCsp ?? [])),
  })
  const headers = securityHeaders({ csp, hsts: !dev })
  const target = env.DSS_DEPLOY_TARGET ?? manifest.deploy.target

  return {
    ...config,
    poweredByHeader: false,
    reactStrictMode: true,
    typedRoutes: true,
    trailingSlash: manifest.seo.trailingSlash,
    cacheComponents: manifest.cacheComponents,
    ...(target === 'docker' ? { output: 'standalone' as const } : {}),
    images: {
      formats: ['image/avif', 'image/webp'],
      ...config.images,
      remotePatterns: [
        ...manifest.images.remotePatterns.map((p) => ({ ...p, pathname: p.pathname ?? '/**' })),
        ...(config.images?.remotePatterns ?? []),
      ],
    },
    async headers() {
      const own = (await config.headers?.()) ?? []
      // A nonce CSP is set per request by proxy.ts; the static one must not be sent alongside it.
      const base = manifest.security.nonce
        ? headers.filter((h) => h.key !== 'Content-Security-Policy')
        : headers
      return [{ source: '/:path*', headers: base }, ...own]
    },
    async redirects() {
      const own = (await config.redirects?.()) ?? []
      return [
        ...manifest.redirects.map((r) => ({
          source: r.from,
          destination: r.to,
          permanent: r.permanent,
        })),
        ...own,
      ]
    },
  }
}
