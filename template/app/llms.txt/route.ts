import { llmsTxt } from '@dss/seo'
import manifest from '@/site.manifest'
import { home } from '@/content/home'
import { site } from '@/content/site'

export const dynamic = 'force-static'

export function GET() {
  const body = llmsTxt(manifest, site.llms, {
    Pages: [{ title: home.meta.title, path: '/', description: home.meta.description }],
  })
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
