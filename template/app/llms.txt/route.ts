import { llmsTxt } from '@dss/seo'
import { pageMeta } from '@/content/meta'
import { moduleLlms } from '@/lib/modules'
import { site } from '@/content/site'
import manifest from '@/site.manifest'

export const dynamic = 'force-static'

export async function GET() {
  const pages = manifest.pages
    .filter((p) => !p.noindex && pageMeta[p.route])
    .map((p) => ({
      path: p.route,
      ...(pageMeta[p.route] as { title: string; description: string }),
    }))
  const body = llmsTxt(manifest, site.llms, { Pages: pages, ...(await moduleLlms()) })
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
