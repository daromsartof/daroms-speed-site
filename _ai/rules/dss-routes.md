---
paths:
  - "app/**/page.tsx"
  - "app/**/layout.tsx"
---
# Routes (app/**/page.tsx, layout.tsx)

> Pages are thin server components: pageMetadata + sections fed from content/; no copy, no logic, no "use client".

- New page: `pnpm dss g page /route --sections hero,features,cta [--label "Nav label"]` (manifest, content, nav updated).
- Shape: `export const metadata = pageMetadata(manifest, { ...content.meta, path: '/route' })`, then `<main id="main">` with sections.
- Dynamic routes: `export default async function Page(props: PageProps<'/blog/[slug]'>)`, `const { slug } = await props.params`,
  plus `generateStaticParams` so the route stays static.
- One `<h1>` per page (the first section's heading). Layout already renders header, footer, skip link, org JSON-LD.
- Redirects and headers belong in `site.manifest.ts`, not in a proxy.
