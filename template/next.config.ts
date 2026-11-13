import { withDss } from '@dss/site/config'
import manifest from './site.manifest.ts'

// Security headers, CSP, images, redirects and deploy output come from site.manifest.ts.
// Pass Next.js options as the second argument; never add a webpack() hook (Turbopack).
export default withDss(manifest)
