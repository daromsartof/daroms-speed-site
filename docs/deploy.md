# Deploy, security and SEO

> Static by default, secure headers and CSP from the manifest, previews never indexed, one command per target.

## Targets

| Target               | Preview                                            | Production                                 |
| -------------------- | -------------------------------------------------- | ------------------------------------------ |
| Cloudflare (default) | `pnpm dss deploy` (OpenNext build, version upload) | `pnpm dss deploy --prod`                   |
| Vercel               | `pnpm dss deploy --target vercel`                  | `--prod`                                   |
| Docker               | image built with `DSS_ENV=preview`                 | image built for production, run behind TLS |

Preview builds set `DSS_ENV=preview`: robots disallow everything and every page is noindex. Production requires the
real domain in the manifest and a strict doctor (no placeholders left). The first Cloudflare deploy needs
`pnpm exec wrangler login`; secrets go through `wrangler secret put`.

Sites ship `.github/workflows/ci.yml` (doctor, lint, types, build) and an opt-in `deploy.yml` for Cloudflare
(repository variable `DSS_DEPLOY=cloudflare`).

## Security defaults

- Static Content-Security-Policy plus HSTS, nosniff, frame denial, referrer and permissions policies on every route.
  Third-party origins are added through manifest presets (turnstile, plausible, youtube, stripe...).
- Every public mutation goes through `safeAction`; env is validated server-side with `defineEnv`; `NEXT_PUBLIC_`
  never carries secrets; hooks and permissions block `.env*` and `.dev.vars`.

## SEO and answer engines

Page metadata with canonical and hreflang, Organization and WebSite JSON-LD site-wide, LocalBusiness, Service, FAQ,
Article and Breadcrumb where they apply, sitemap, robots with an AI training crawler policy, and `llms.txt`.
Generated pages score 100 for SEO and accessibility on Lighthouse mobile.
