import { describe, expect, it } from 'vitest'
import { defineManifest } from '@dss/site/config'
import {
  absoluteUrl,
  buildGraph,
  canonicalPath,
  deployEnv,
  faqSchema,
  llmsTxt,
  localBusinessSchema,
  organizationSchema,
  pageMetadata,
  robots,
  sitemap,
} from '../src/index.ts'

const manifest = defineManifest({
  name: 'Atelier Nord',
  url: 'https://ateliernord.example',
  pages: [
    { route: '/', name: 'home' },
    { route: '/about', name: 'about' },
    { route: '/thanks', name: 'thanks', noindex: true },
  ],
  seo: {
    organization: {
      email: 'hello@ateliernord.example',
      localBusinessType: 'FurnitureStore',
      address: { street: '1 Rue du Bois', city: 'Lyon', country: 'FR' },
    },
  },
})
const prod = { NODE_ENV: 'production' }
const preview = { NODE_ENV: 'production', DSS_ENV: 'preview' }

describe('environment', () => {
  it('treats Vercel previews and DSS_ENV=preview as non-production', () => {
    expect(deployEnv(prod)).toBe('production')
    expect(deployEnv(preview)).toBe('preview')
    expect(deployEnv({ NODE_ENV: 'production', VERCEL_ENV: 'preview' })).toBe('preview')
    expect(deployEnv({ NODE_ENV: 'development' })).toBe('development')
  })
})

describe('urls', () => {
  it('applies the trailing-slash policy', () => {
    expect(canonicalPath(manifest, '/about/')).toBe('/about')
    expect(canonicalPath(manifest, '/')).toBe('/')
    const slashed = defineManifest({ ...manifest, seo: { trailingSlash: true } })
    expect(canonicalPath(slashed, '/about')).toBe('/about/')
    expect(absoluteUrl(manifest, '/about?x=1')).toBe('https://ateliernord.example/about?x=1')
  })
})

describe('pageMetadata', () => {
  it('sets canonical, OG and indexable robots in production', () => {
    const meta = pageMetadata(
      manifest,
      { title: 'About', description: 'Who we are', path: '/about/' },
      prod,
    )
    expect(meta.alternates?.canonical).toBe('/about')
    expect(meta.openGraph).toMatchObject({
      url: 'https://ateliernord.example/about',
      title: 'About',
    })
    expect(meta.robots).toMatchObject({ index: true })
  })

  it('never indexes previews or noindex pages', () => {
    expect(
      pageMetadata(manifest, { title: 'A', description: 'B', path: '/' }, preview).robots,
    ).toEqual({ index: false, follow: false })
    expect(
      pageMetadata(manifest, { title: 'A', description: 'B', path: '/', noindex: true }, prod)
        .robots,
    ).toEqual({ index: false, follow: false })
  })

  it('adds hreflang with x-default', () => {
    const meta = pageMetadata(
      manifest,
      { title: 'A', description: 'B', path: '/about', languages: { fr: '/fr/a-propos' } },
      prod,
    )
    expect(meta.alternates?.languages).toEqual({
      en: 'https://ateliernord.example/about',
      fr: 'https://ateliernord.example/fr/a-propos',
      'x-default': 'https://ateliernord.example/about',
    })
  })
})

describe('json-ld', () => {
  it('builds a graph without undefined fields and escapes <', () => {
    const json = buildGraph([
      organizationSchema(manifest, 'Desc </script>'),
      localBusinessSchema(manifest),
      undefined,
    ])
    const parsed = JSON.parse(json) as { '@graph': Record<string, unknown>[] }
    expect(parsed['@graph']).toHaveLength(2)
    expect(parsed['@graph'][1]?.['@type']).toBe('FurnitureStore')
    expect(json).not.toContain('</script>')
    expect(json).not.toContain('legalName')
  })

  it('builds FAQ pages', () => {
    expect(faqSchema([{ question: 'Q?', answer: 'A.' }])).toMatchObject({ '@type': 'FAQPage' })
  })
})

describe('routes', () => {
  it('blocks everything on previews', () => {
    expect(robots(manifest, preview)).toEqual({ rules: [{ userAgent: '*', disallow: '/' }] })
  })

  it('can block AI training crawlers', () => {
    const blocked = defineManifest({ ...manifest, seo: { aiCrawlers: 'block' } })
    const rules = robots(blocked, prod).rules as { userAgent: string | string[] }[]
    expect(rules[1]?.userAgent).toContain('GPTBot')
  })

  it('lists indexable pages in the sitemap', () => {
    const urls = sitemap(manifest).map((e) => e.url)
    expect(urls).toEqual(['https://ateliernord.example/', 'https://ateliernord.example/about'])
  })

  it('renders llms.txt', () => {
    const txt = llmsTxt(
      manifest,
      { summary: 'Furniture.' },
      { Pages: [{ title: 'About', path: '/about', description: 'Who.' }], Empty: [] },
    )
    expect(txt).toContain('# Atelier Nord\n\n> Furniture.')
    expect(txt).toContain('- [About](https://ateliernord.example/about): Who.')
    expect(txt).not.toContain('## Empty')
  })
})
