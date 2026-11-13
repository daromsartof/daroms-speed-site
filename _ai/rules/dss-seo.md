---
paths:
  - "app/**/page.tsx"
  - "app/layout.tsx"
  - "app/robots.ts"
  - "app/sitemap.ts"
  - "app/**/opengraph-image.tsx"
  - "site.manifest.ts"
---
# SEO and GEO

> Metadata, canonical, robots, sitemap, llms.txt and JSON-LD come from @dss/seo and the manifest; previews are noindexed automatically.

- Page: `pageMetadata(manifest, { title, description, path })`; languages map for hreflang when i18n is on.
- JSON-LD: organizationSchema/websiteSchema in the layout; faqSchema, serviceSchema, articleSchema, localBusinessSchema per page
  through `<JsonLd nodes={[...]} />`. Fill `seo.organization` (address, telephone, localBusinessType) for local businesses.
- AI crawlers: `seo.aiCrawlers` allow (default, GEO) or block. llms.txt lists indexable pages from content meta.
- Answer-first copy: each page answers its main question in the first 100 words; H2s phrased as the questions people search.
- Set the real `url` before launch (`dss doctor` warns on `.example`).
