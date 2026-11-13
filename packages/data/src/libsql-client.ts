import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

export type LibsqlOptions = { url?: string; authToken?: string }

const clients = new Map<string, ReturnType<typeof createClient>>()

/** Drizzle on libSQL: a local file (`file:./data/site.db`), Turso, or `:memory:` in tests. */
export function libsqlDb<Schema extends Record<string, unknown>>(
  schema: Schema,
  options: LibsqlOptions = {},
) {
  const url = options.url ?? process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set (see .env.example).')
  const authToken = options.authToken ?? process.env.DATABASE_AUTH_TOKEN
  let client = clients.get(url)
  if (!client) {
    client = createClient({ url, authToken })
    if (url !== ':memory:') clients.set(url, client)
  }
  return drizzle(client, { schema })
}
