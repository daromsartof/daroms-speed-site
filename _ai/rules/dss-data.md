---
paths:
  - "server/**"
  - "drizzle.config.ts"
---
# Data (server/, Drizzle)

> Drizzle only in server/; schema in server/db/schema.ts, migrations generated and committed; every file imports 'server-only'.

- Client: `d1Db(schema)` on Cloudflare (binding DB) or `libsqlDb(schema)` elsewhere, from @dss/data; call inside a request.
- Columns: `id()` and `...timestamps()` from @dss/data; snake_case column names, camelCase fields.
- `pnpm exec drizzle-kit generate` after a schema change; local D1: `wrangler d1 migrations apply DB --local`.
- Validate inputs and outputs with zod at the boundary; never interpolate SQL strings (use Drizzle operators or `sql` template).
- Personal data: collect the minimum, document retention in the legal page.
