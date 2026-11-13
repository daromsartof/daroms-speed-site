---
paths:
  - "server/**"
  - "drizzle.config.ts"
---
# Data (server/, Drizzle)

> Drizzle only in server/; schema in server/db/schema.ts, migrations generated and committed; every file imports 'server-only'.

- Set up once: `pnpm dss db init [--driver d1|libsql|postgres]`; then `db()` from `@/server/db/client` inside a request.
- Columns: `id()` and `...timestamps()` from @dss/data; snake_case column names, camelCase fields.
- After a schema change: `pnpm db:generate` then `pnpm db:migrate` (D1 local, libSQL or Postgres per driver); `pnpm db:studio` to inspect.
- Postgres schemas use `drizzle-orm/pg-core` and `@dss/data/pg` columns; SQLite ones `sqlite-core` and `@dss/data`.
- Validate inputs and outputs with zod at the boundary; never interpolate SQL strings (use Drizzle operators or `sql` template).
- Personal data: collect the minimum, document retention in the legal page.
