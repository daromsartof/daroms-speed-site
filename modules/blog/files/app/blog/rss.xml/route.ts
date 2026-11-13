import { absoluteUrl } from '@dss/seo'
import { blog } from '@/content/blog'
import { getPosts } from '@/lib/blog'
import manifest from '@/site.manifest'

export const dynamic = 'force-static'

const escape = (s: string) => s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`)

export function GET() {
  const items = getPosts()
    .map(
      (p) =>
        `<item><title>${escape(p.title)}</title><link>${absoluteUrl(manifest, `/blog/${p.slug}`)}</link><guid>${absoluteUrl(manifest, `/blog/${p.slug}`)}</guid><pubDate>${new Date(p.date).toUTCString()}</pubDate><description>${escape(p.description)}</description></item>`,
    )
    .join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escape(`${manifest.name}: ${blog.index.title}`)}</title><link>${absoluteUrl(manifest, '/blog')}</link><description>${escape(blog.meta.description)}</description>${items}</channel></rss>`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
