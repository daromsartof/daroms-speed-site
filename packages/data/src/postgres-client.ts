import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

export type PostgresOptions = { url?: string; max?: number }

const clients = new Map<string, ReturnType<typeof postgres>>()

/**
 * Drizzle on Postgres (Neon, Supabase, RDS, self-hosted) through postgres.js. One pool per URL.
 * On Cloudflare Workers prefer Hyperdrive and pass its connection string as `url`.
 */
export function postgresDb<Schema extends Record<string, unknown>>(
  schema: Schema,
  options: PostgresOptions = {},
) {
  const url = options.url ?? process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set (see .env.example).')
  let client = clients.get(url)
  if (!client) {
    client = postgres(url, { max: options.max ?? 5, prepare: false })
    clients.set(url, client)
  }
  return drizzle(client, { schema })
}
