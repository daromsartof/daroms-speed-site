// The site's structure and settings. Rewritten by the dss CLI (pages, modules, deploy); edit freely.
import { defineManifest } from '@dss/site/config'

export default defineManifest({
  name: 'Atelier Nord',
  url: 'https://example.com',
  locale: 'en',
  industry: 'artisan',
  deploy: { target: 'cloudflare' },
  pages: [{ route: '/', name: 'home', sections: ['hero'] }],
  seo: {
    organization: { sameAs: [] },
  },
})
