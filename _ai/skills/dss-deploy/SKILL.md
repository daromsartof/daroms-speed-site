---
name: dss-deploy
description: Deploys the site to its manifest target (Cloudflare default, Vercel, Docker) - preview first with noindex, production only after explicit approval - and records the URL.
argument-hint: "[preview|production]"
disable-model-invocation: true
---

# /dss-deploy: ship

Mode: $ARGUMENTS (default preview)

1. Read `site.manifest.ts > deploy` and the matching on-demand rule (`.claude/rules-ondemand/dss-deploy-<target>.md`).
2. Preconditions: `/dss-check` green; `pnpm dss doctor --strict` passes or the user accepts the listed open facts; real `url` set.
3. Account steps are the user's (logins, secrets): tell them the exact command to type with `!` (for example `! pnpm exec wrangler login`).
4. Preview: Cloudflare `DSS_ENV=preview pnpm cf:deploy`; Vercel `pnpm exec vercel`; Docker `DSS_ENV=preview pnpm docker:build`.
   Check the preview URL answers, `/robots.txt` disallows all.
5. Production only after an explicit yes (AskUserQuestion): `pnpm cf:deploy` / `pnpm exec vercel --prod` / image push.
6. Write the URLs in `site.spec.md > Launch`. **Stop**: URLs and the next manual step (domain, DNS, Search Console).
