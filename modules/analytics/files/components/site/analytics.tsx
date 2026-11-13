import Script from 'next/script'
import { isIndexable } from '@dss/seo'
import manifest from '@/site.manifest'

type AnalyticsConfig = {
  provider?: 'plausible' | 'umami' | 'cloudflare'
  /** Plausible: tracked domain (defaults to the manifest url host). */
  domain?: string
  /** Umami: website id. */
  websiteId?: string
  /** Cloudflare Web Analytics: beacon token. */
  token?: string
  /** Self-hosted script URL (add its origin to the manifest CSP). */
  src?: string
}

/** Cookieless analytics script, rendered only in production builds (previews and dev stay clean). */
export function Analytics() {
  const config = (manifest.modules.analytics ?? {}) as AnalyticsConfig
  if (!isIndexable()) return null
  switch (config.provider ?? 'plausible') {
    case 'plausible':
      return (
        <Script
          defer
          strategy="afterInteractive"
          data-domain={config.domain ?? new URL(manifest.url).hostname}
          src={config.src ?? 'https://plausible.io/js/script.js'}
        />
      )
    case 'umami':
      return config.websiteId ? (
        <Script
          defer
          strategy="afterInteractive"
          data-website-id={config.websiteId}
          src={config.src ?? 'https://cloud.umami.is/script.js'}
        />
      ) : null
    case 'cloudflare':
      return config.token ? (
        <Script
          defer
          strategy="afterInteractive"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={JSON.stringify({ token: config.token })}
        />
      ) : null
    default:
      return null
  }
}
