import { sitemap } from '@dss/seo'
import { moduleSitemap } from '@/lib/modules'
import manifest from '@/site.manifest'

export default async function sitemapXml() {
  return sitemap(manifest, await moduleSitemap())
}
