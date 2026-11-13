import { robots } from '@dss/seo'
import manifest from '@/site.manifest'

export default function robotsTxt() {
  return robots(manifest)
}
