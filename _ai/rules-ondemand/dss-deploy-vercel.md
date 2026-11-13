# Deploy: Vercel

> Set `deploy.target: 'vercel'`; `pnpm exec vercel` for previews (noindexed via VERCEL_ENV), `pnpm exec vercel --prod` for production.

- Link once: `pnpm exec vercel link`. Env vars in the dashboard or `vercel env add` (never pull them into the repo).
- Git integration needs `submodules: true` style checkout: enable "Include Git submodules" or use the copy core mode.
