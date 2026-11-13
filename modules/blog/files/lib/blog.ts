import 'server-only'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { LlmsEntry, SitemapEntry } from '@dss/seo'

export type Post = {
  slug: string
  title: string
  description: string
  date: string
  author?: string
  image?: string
  body: string
}

const DIR = join(process.cwd(), 'content', 'blog')

/** Minimal front matter: `key: value` lines between `---` fences. */
function parse(slug: string, raw: string): Post {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw)
  const meta: Record<string, string> = {}
  for (const line of (match?.[1] ?? '').split('\n')) {
    const [key, ...rest] = line.split(':')
    if (key && rest.length)
      meta[key.trim()] = rest
        .join(':')
        .trim()
        .replace(/^['"]|['"]$/g, '')
  }
  return {
    slug,
    title: meta.title ?? slug,
    description: meta.description ?? '',
    date: meta.date ?? '1970-01-01',
    author: meta.author,
    image: meta.image,
    body: match?.[2] ?? raw,
  }
}

/** All posts, newest first. Read at build time (pages are prerendered). */
export function getPosts(): Post[] {
  return readdirSync(DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parse(f.replace(/\.md$/, ''), readFileSync(join(DIR, f), 'utf8')))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((p) => p.slug === slug)
}

export async function blogSitemap(): Promise<SitemapEntry[]> {
  return getPosts().map((p) => ({ path: `/blog/${p.slug}`, lastModified: p.date, priority: 0.6 }))
}

export async function blogLlms(): Promise<Record<string, LlmsEntry[]>> {
  return {
    Articles: getPosts().map((p) => ({
      title: p.title,
      path: `/blog/${p.slug}`,
      description: p.description,
    })),
  }
}
