import { z } from 'zod'

const route = z
  .string()
  .regex(/^\/[^\s?#]*$/, 'Route must start with "/" and contain no query or hash')

export const PageSchema = z.object({
  route,
  /** Internal name used by generators and the prompt router. */
  name: z.string().min(1),
  /** Section ids in render order (registry ids or bespoke names). */
  sections: z.array(z.string()).default([]),
  nav: z.boolean().default(true),
  noindex: z.boolean().default(false),
  priority: z.number().min(0).max(1).optional(),
  changeFrequency: z
    .enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'])
    .optional(),
})

const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  postalCode: z.string().optional(),
  region: z.string().optional(),
  country: z.string().length(2, 'ISO 3166-1 alpha-2 country code'),
})

export const OrganizationSchema = z.object({
  legalName: z.string().optional(),
  logo: z.string().optional(),
  email: z.email().optional(),
  telephone: z.string().optional(),
  address: AddressSchema.optional(),
  sameAs: z.array(z.url()).default([]),
  /** LocalBusiness subtype when the business has premises (Restaurant, Dentist, LegalService...). */
  localBusinessType: z.string().optional(),
  geo: z.object({ latitude: z.number(), longitude: z.number() }).optional(),
  openingHours: z.array(z.string()).default([]),
  priceRange: z.string().optional(),
})

const CspExtraSchema = z
  .object({
    presets: z.array(z.string()).default([]),
    scriptSrc: z.array(z.string()).default([]),
    styleSrc: z.array(z.string()).default([]),
    imgSrc: z.array(z.string()).default([]),
    fontSrc: z.array(z.string()).default([]),
    connectSrc: z.array(z.string()).default([]),
    frameSrc: z.array(z.string()).default([]),
    mediaSrc: z.array(z.string()).default([]),
    formAction: z.array(z.string()).default([]),
  })
  .prefault({})

export const ManifestSchema = z.object({
  name: z.string().min(1),
  url: z.url().refine((u) => !u.endsWith('/'), 'Site url must not end with "/"'),
  /** Default language (BCP 47). */
  locale: z.string().default('en'),
  /** Extra languages served by the i18n module. */
  locales: z.array(z.string()).default([]),
  industry: z.string().default('general'),
  deploy: z
    .object({
      target: z.enum(['cloudflare', 'vercel', 'docker']).default('cloudflare'),
      /** static = prerendered only; r2 = ISR / tagged revalidation on Cloudflare. */
      cache: z.enum(['static', 'r2']).default('static'),
    })
    .prefault({}),
  db: z
    .object({ driver: z.enum(['none', 'd1', 'libsql', 'postgres']).default('none') })
    .prefault({}),
  pages: z.array(PageSchema).min(1),
  modules: z.record(z.string(), z.record(z.string(), z.unknown())).default({}),
  seo: z
    .object({
      trailingSlash: z.boolean().default(false),
      twitter: z.string().optional(),
      organization: OrganizationSchema.optional(),
      llmsTxt: z.boolean().default(true),
      /** allow = AI crawlers welcome (GEO); block = disallow known AI training crawlers. */
      aiCrawlers: z.enum(['allow', 'block']).default('allow'),
    })
    .prefault({}),
  security: z.object({ csp: CspExtraSchema, nonce: z.boolean().default(false) }).prefault({}),
  images: z
    .object({
      remotePatterns: z
        .array(
          z.object({
            protocol: z.enum(['https', 'http']).default('https'),
            hostname: z.string(),
            pathname: z.string().optional(),
          }),
        )
        .default([]),
    })
    .prefault({}),
  redirects: z
    .array(z.object({ from: route, to: z.string(), permanent: z.boolean().default(true) }))
    .default([]),
  /** Next.js Cache Components (PPR). Off by default; incompatible with a nonce CSP. */
  cacheComponents: z.boolean().default(false),
})

export type Manifest = z.infer<typeof ManifestSchema>
export type ManifestInput = z.input<typeof ManifestSchema>
export type Page = z.infer<typeof PageSchema>

/** The raw input is kept (non-enumerable) so the CLI can rewrite the file without expanding defaults. */
export const MANIFEST_INPUT = Symbol.for('dss.manifest.input')

/** `site.manifest.ts`: `export default defineManifest({...})`. Validated at import time. */
export function defineManifest(input: ManifestInput): Manifest {
  const result = ManifestSchema.safeParse(input)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`site.manifest.ts is invalid:\n${issues}`)
  }
  const routes = result.data.pages.map((p) => p.route)
  const duplicate = routes.find((r, i) => routes.indexOf(r) !== i)
  if (duplicate)
    throw new Error(`site.manifest.ts is invalid:\n  - pages: duplicate route ${duplicate}`)
  Object.defineProperty(result.data, MANIFEST_INPUT, { value: input, enumerable: false })
  return result.data
}
