import { sitemap } from '@dss/seo'
import manifest from '@/site.manifest'

export default function sitemapXml() {
  return sitemap(manifest)
}
