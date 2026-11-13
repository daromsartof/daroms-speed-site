---
paths:
  - "server/actions/**"
  - "app/**/actions.ts"
  - "app/api/**"
---
# Server Actions and route handlers

> Every public mutation goes through safeAction (zod, honeypot, per-IP rate limit, Turnstile) and returns ActionResult.

- `export const send = safeAction(schema, async (input, { ip }) => {...}, { rateLimiter, turnstileSecret: () => env.TURNSTILE_SECRET })`.
- Messages shown to users come from content/ (pass `messages`). Never return internal errors.
- Rate limiter: Workers Rate Limiting binding on Cloudflare (`cloudflareRateLimiter`), memory only in dev.
- Route handlers: validate the body with zod, set explicit cache headers, never echo secrets.
- After a mutation that changes cached data: `updateTag(tag)` (actions) or `revalidateTag(tag, 'max')`.
