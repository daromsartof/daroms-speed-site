# Database: advanced

> D1 for Cloudflare sites, libSQL/Turso for Docker, Postgres (Neon) when relational load or extensions require it.

- Indexes for every foreign key and frequent filter; pagination by cursor, never OFFSET on large tables.
- Read-heavy pages: cache with `"use cache"` + `cacheTag`, invalidate with `updateTag` in the action.
- Backups: D1 time travel / Turso point-in-time; document restore steps in the handoff.
