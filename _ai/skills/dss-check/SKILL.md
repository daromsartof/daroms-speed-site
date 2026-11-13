---
name: dss-check
description: Full verification - dss doctor strict, rule scan, production build, Lighthouse mobile budgets, OpenNext build for Cloudflare targets - and fixes until green.
context: fork
background: false
model: sonnet
effort: medium
---

# /dss-check: everything green

1. `pnpm dss doctor --strict` (fails on placeholders: list them as open facts instead of inventing), and
   `python3 .claude/hooks/dss-check-rules.py --all`.
2. `pnpm test` (unit tests of `lib/` and `server/` logic), then `pnpm build`: all routes static unless the plan needs otherwise; read the size table for heavy pages.
3. `pnpm start` in the background, then Lighthouse mobile on the home page and the heaviest page:
   `npx -y lighthouse@13 http://localhost:3000<route> --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo --quiet --output=json`
   Budgets: performance >= 90, others >= 95 (`.claude/rules-ondemand/dss-performance-budget.md`).
4. Cloudflare target: `pnpm cf:build && pnpm exec wrangler deploy --dry-run` (upload gzip under 3 MiB).
5. Fix what fails (root cause, not suppression); rerun the failing step.
6. **Stop**: scores and the fixes, one line each.
