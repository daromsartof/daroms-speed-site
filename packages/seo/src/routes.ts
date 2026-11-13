import type { MetadataRoute } from 'next'
import type { Manifest } from '@dss/site/config'
import { isIndexable } from './env.ts'
import { absoluteUrl } from './url.ts'

/** Crawlers that collect training data. Search and answer-engine fetchers are not listed. */
export const AI_TRAINING_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'CCBot',
  'Google-Extended',
  'Applebot-Extended',
  'Bytespider',
  'meta-externalagent',
  'cohere-training-data-crawler',
] as const

export function robots(
  manifest: Manifest,
  env?: Record<string, string | undefined>,
): MetadataRoute.Robots {
  if (!isIndexable(env)) return { rules: [{ userAgent: '*', disallow: '/' }] }
  const rules: MetadataRoute.Robots['rules'] = [{ userAgent: '*', allow: '/' }]
  if (manifest.seo.aiCrawlers === 'block')
    rules.push({ userAgent: [...AI_TRAINING_CRAWLERS], disallow: '/' })
  return { rules, sitemap: `${manifest.url}/sitemap.xml`, host: manifest.url }
}

export type SitemapEntry = { path: string; lastModified?: string | Date; priority?: number }

export function sitemap(
  manifest: Manifest,
  extra: readonly SitemapEntry[] = [],
): MetadataRoute.Sitemap {
  const pages = manifest.pages
    .filter((p) => !p.noindex)
    .map((p) => ({
      url: absoluteUrl(manifest, p.route),
      changeFrequency: p.changeFrequency,
      priority: p.priority ?? (p.route === '/' ? 1 : 0.7),
    }))
  return [
    ...pages,
    ...extra.map((e) => ({
      url: absoluteUrl(manifest, e.path),
      lastModified: e.lastModified,
      priority: e.priority ?? 0.6,
    })),
  ]
}

export type LlmsEntry = { title: string; path: string; description: string }

/** llms.txt (llmstxt.org): a plain index of the site for answer engines and agents. */
export function llmsTxt(
  manifest: Manifest,
  intro: { summary: string; details?: string },
  sections: Record<string, readonly LlmsEntry[]>,
): string {
  const lines = [`# ${manifest.name}`, '', `> ${intro.summary}`, '']
  if (intro.details) lines.push(intro.details, '')
  for (const [title, entries] of Object.entries(sections)) {
    if (!entries.length) continue
    lines.push(`## ${title}`, '')
    for (const e of entries)
      lines.push(`- [${e.title}](${absoluteUrl(manifest, e.path)}): ${e.description}`)
    lines.push('')
  }
  return lines.join('\n')
}
