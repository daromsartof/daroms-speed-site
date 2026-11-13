import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
import { withDss } from '@dss/site/config'
import manifest from './site.manifest.ts'

// D1 and other Cloudflare bindings in `next dev` (only when the site uses them).
if (manifest.db.driver === 'd1' && process.env.NODE_ENV === 'development')
  initOpenNextCloudflareForDev()

// Security headers, CSP, images, redirects and deploy output come from site.manifest.ts.
// Pass Next.js options as the second argument; never add a webpack() hook (Turbopack).
export default withDss(manifest)
