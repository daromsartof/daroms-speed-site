import type { Manifest } from '@dss/site/config'
import { absoluteUrl } from './url.ts'

export type JsonLdNode = { '@type': string | string[]; '@id'?: string; [key: string]: unknown }

export const nodeId = (manifest: Manifest, name: string) => `${manifest.url}/#${name}`

function postalAddress(manifest: Manifest) {
  const a = manifest.seo.organization?.address
  return a
    ? {
        '@type': 'PostalAddress',
        streetAddress: a.street,
        addressLocality: a.city,
        postalCode: a.postalCode,
        addressRegion: a.region,
        addressCountry: a.country,
      }
    : undefined
}

export function organizationSchema(manifest: Manifest, description?: string): JsonLdNode {
  const org = manifest.seo.organization
  return {
    '@type': 'Organization',
    '@id': nodeId(manifest, 'organization'),
    name: manifest.name,
    legalName: org?.legalName,
    url: manifest.url,
    description,
    logo: org?.logo ? absoluteUrl(manifest, org.logo) : undefined,
    email: org?.email,
    telephone: org?.telephone,
    address: postalAddress(manifest),
    sameAs: org?.sameAs.length ? org.sameAs : undefined,
  }
}

export function websiteSchema(manifest: Manifest, description?: string): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': nodeId(manifest, 'website'),
    url: manifest.url,
    name: manifest.name,
    description,
    inLanguage: manifest.locale,
    publisher: { '@id': nodeId(manifest, 'organization') },
  }
}

/** LocalBusiness (or a subtype such as Restaurant, Dentist, LegalService) when the site has premises. */
export function localBusinessSchema(manifest: Manifest, image?: string): JsonLdNode | undefined {
  const org = manifest.seo.organization
  if (!org?.localBusinessType || !org.address) return undefined
  return {
    '@type': org.localBusinessType,
    '@id': nodeId(manifest, 'localbusiness'),
    name: manifest.name,
    url: manifest.url,
    image: image ? absoluteUrl(manifest, image) : undefined,
    telephone: org.telephone,
    email: org.email,
    priceRange: org.priceRange,
    address: postalAddress(manifest),
    geo: org.geo ? { '@type': 'GeoCoordinates', ...org.geo } : undefined,
    openingHours: org.openingHours.length ? org.openingHours : undefined,
    parentOrganization: { '@id': nodeId(manifest, 'organization') },
  }
}

export function breadcrumbSchema(
  manifest: Manifest,
  trail: readonly { name: string; path: string }[],
): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(manifest, item.path),
    })),
  }
}

export function faqSchema(items: readonly { question: string; answer: string }[]): JsonLdNode {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  }
}

export function serviceSchema(
  manifest: Manifest,
  service: { name: string; description: string; path?: string; areaServed?: readonly string[] },
): JsonLdNode {
  return {
    '@type': 'Service',
    name: service.name,
    description: service.description,
    url: service.path ? absoluteUrl(manifest, service.path) : undefined,
    provider: { '@id': nodeId(manifest, 'organization') },
    areaServed: service.areaServed?.map((name) => ({ '@type': 'Place', name })),
  }
}

export function articleSchema(
  manifest: Manifest,
  post: {
    title: string
    description: string
    path: string
    published: string
    modified?: string
    author?: string
    image?: string
  },
): JsonLdNode {
  return {
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: absoluteUrl(manifest, post.path),
    mainEntityOfPage: absoluteUrl(manifest, post.path),
    datePublished: post.published,
    dateModified: post.modified ?? post.published,
    image: post.image ? absoluteUrl(manifest, post.image) : undefined,
    author: post.author
      ? { '@type': 'Person', name: post.author }
      : { '@id': nodeId(manifest, 'organization') },
    publisher: { '@id': nodeId(manifest, 'organization') },
    inLanguage: manifest.locale,
  }
}

export function eventSchema(
  manifest: Manifest,
  event: {
    name: string
    start: string
    end?: string
    location: string
    description?: string
    path?: string
  },
): JsonLdNode {
  return {
    '@type': 'Event',
    name: event.name,
    startDate: event.start,
    endDate: event.end,
    description: event.description,
    url: event.path ? absoluteUrl(manifest, event.path) : undefined,
    location: { '@type': 'Place', name: event.location },
    organizer: { '@id': nodeId(manifest, 'organization') },
  }
}

const stripUndefined = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripUndefined)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)]),
    )
  }
  return value
}

/**
 * Serialises nodes into one @graph. `<` is escaped so the payload can never close the
 * surrounding <script> tag, even if a string came from a CMS.
 */
export function buildGraph(nodes: readonly (JsonLdNode | undefined)[]): string {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': nodes.filter(Boolean).map(stripUndefined),
  }
  return JSON.stringify(graph).replace(/</g, '\\u003c')
}
