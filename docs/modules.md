# Modules and data

> Optional features install site-owned code, environment documentation, CSP sources and manifest entries, and plug into generated slots.

## Modules

```bash
pnpm dss module list
pnpm dss module add forms                      # contact form on /contact
pnpm dss module add analytics --config provider=umami,websiteId=<id>
pnpm dss module remove blog
```

| Module      | What it adds                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| `forms`     | contact section, Server Action through `safeAction` (zod, honeypot, rate limit, Turnstile), email via Resend |
| `legal`     | legal notice and privacy pages (GDPR, Swiss nLPD structure) linked from the footer                           |
| `analytics` | cookieless Plausible, Umami or Cloudflare Web Analytics, production builds only                              |
| `blog`      | Markdown articles, index, Article JSON-LD, RSS, sitemap and llms.txt entries                                 |

Each module documents its variables in `.env.example`, adds CSP presets to the manifest, and contributes to generated
slots (`lib/modules.ts` for sitemap and llms.txt entries, `components/site/module-slots.tsx` for end-of-body
scripts). Removal deletes only unmodified files. Read `core/modules/<slug>/README.md` after adding one.

## Database

```bash
pnpm dss db init                 # D1 on Cloudflare sites, libSQL elsewhere
pnpm dss db init --driver postgres
pnpm db:generate && pnpm db:migrate && pnpm db:studio
```

The schema lives in `server/db/schema.ts` (Drizzle; SQLite dialect for D1 and libSQL, Postgres dialect for Postgres),
the client in `server/db/client.ts` (`db()` inside a request). D1 gets a binding in `wrangler.jsonc`, available in
`next dev` through OpenNext.
