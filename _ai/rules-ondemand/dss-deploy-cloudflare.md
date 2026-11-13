# Deploy: Cloudflare (default)

> OpenNext on Workers: `pnpm cf:preview` locally, `DSS_ENV=preview pnpm cf:deploy` for a preview, `pnpm cf:deploy` for production.

- First time: `pnpm exec wrangler login` (the user runs it), set the worker name in wrangler.jsonc, custom domain in the dashboard.
- Secrets: `pnpm exec wrangler secret put NAME` (the user types the value); local values in `.dev.vars` (never read it).
- Static sites use the static-assets incremental cache; ISR or tagged revalidation needs `deploy.cache: 'r2'` + an R2 bucket.
- Worker size budget: gzip upload under 3 MiB (free plan); check the `wrangler deploy --dry-run` total.
