import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache'

// Static marketing sites: prerendered pages are served from Workers static assets, no extra binding.
// Sites that revalidate (ISR, "use cache" with tags) switch to the R2 incremental cache.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
})
