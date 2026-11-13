import { llmsTxt } from '@dss/seo'
import { pageMeta } from '@/content/meta'
import { site } from '@/content/site'
import manifest from '@/site.manifest'

export const dynamic = 'force-static'

export function GET() {
  const pages = manifest.pages
    .filter((p) => !p.noindex && pageMeta[p.route])
    .map((p) => ({
      path: p.route,
      ...(pageMeta[p.route] as { title: string; description: string }),
    }))
  const body = llmsTxt(manifest, site.llms, { Pages: pages })
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
