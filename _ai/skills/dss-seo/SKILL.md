---
name: dss-seo
description: SEO and GEO pass - metadata per page, organisation and local business data, JSON-LD per page type, sitemap, robots, llms.txt, internal links - verified on the built site.
context: fork
background: false
model: sonnet
effort: medium
---

# /dss-seo: search and answer engines

1. Read `site.spec.md` (SEO targets, Market, Legal) and `.claude/rules/dss-seo.md`.
2. Manifest: real `url`, `seo.organization` (legalName, email, telephone, address, sameAs, localBusinessType, openingHours when local).
3. Each page: meta title/description lengths, keyword first, one h1 matching the query, H2s phrased as real questions,
   2-3 internal links with descriptive anchors. Add serviceSchema / faqSchema / breadcrumbSchema where they apply.
4. `pnpm build && pnpm start`, then check `/robots.txt`, `/sitemap.xml`, `/llms.txt` and one page's `<head>` (canonical, og, JSON-LD).
5. Optional deeper audit: the claude-seo plugin skills if installed (seo-technical, seo-schema, seo-geo).
6. **Stop**: fixes applied (one line each) and anything blocked on open facts.
