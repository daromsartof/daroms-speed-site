import type { Metadata } from 'next'
import type { Manifest } from '@dss/site/config'
import { isIndexable } from './env.ts'
import { absoluteUrl, canonicalPath } from './url.ts'

export type PageMeta = {
  title: string
  description: string
  /** Route of the page ("/about"). */
  path: string
  /** Site-relative or absolute social image; defaults to the route's opengraph-image. */
  image?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  noindex?: boolean
  /** Alternate language versions: { fr: '/fr/a-propos' }. */
  languages?: Record<string, string>
}

const robots = (index: boolean): Metadata['robots'] =>
  index
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
      }
    : { index: false, follow: false }

/** Root layout metadata: title template, metadataBase, site-wide defaults. */
export function rootMetadata(
  manifest: Manifest,
  copy: { tagline: string; description: string },
  env?: Record<string, string | undefined>,
): Metadata {
  return {
    metadataBase: new URL(manifest.url),
    title: { default: `${manifest.name} | ${copy.tagline}`, template: `%s | ${manifest.name}` },
    description: copy.description,
    applicationName: manifest.name,
    alternates: { canonical: '/' },
    robots: robots(isIndexable(env)),
    openGraph: {
      type: 'website',
      siteName: manifest.name,
      url: manifest.url,
      locale: manifest.locale,
    },
    twitter: {
      card: 'summary_large_image',
      ...(manifest.seo.twitter ? { site: manifest.seo.twitter } : {}),
    },
    formatDetection: { email: false, address: false, telephone: false },
  }
}

/** Per-page metadata. Every page goes through this: canonical, OG, Twitter, robots, hreflang. */
export function pageMetadata(
  manifest: Manifest,
  meta: PageMeta,
  env?: Record<string, string | undefined>,
): Metadata {
  const url = absoluteUrl(manifest, meta.path)
  const image = meta.image
    ? meta.image.startsWith('http')
      ? meta.image
      : absoluteUrl(manifest, meta.image)
    : undefined
  const languages = meta.languages
    ? Object.fromEntries(
        Object.entries(meta.languages).map(([lang, path]) => [lang, absoluteUrl(manifest, path)]),
      )
    : undefined
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: canonicalPath(manifest, meta.path),
      ...(languages
        ? { languages: { [manifest.locale]: url, ...languages, 'x-default': url } }
        : {}),
    },
    robots: robots(isIndexable(env) && !meta.noindex),
    openGraph: {
      type: meta.type ?? 'website',
      url,
      title: meta.title,
      description: meta.description,
      siteName: manifest.name,
      locale: manifest.locale,
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: meta.title }] } : {}),
      ...(meta.type === 'article'
        ? { publishedTime: meta.publishedTime, modifiedTime: meta.modifiedTime }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      ...(image ? { images: [image] } : {}),
    },
  }
}
