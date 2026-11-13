import 'server-only'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { drizzle } from 'drizzle-orm/d1'

type D1Binding = Parameters<typeof drizzle>[0]

/**
 * Drizzle on the Cloudflare D1 binding (default `DB`, declared in wrangler.jsonc by `dss db init`).
 * Call it inside a request (server component, action, route handler), not at module scope.
 */
export function d1Db<Schema extends Record<string, unknown>>(schema: Schema, binding = 'DB') {
  const { env } = getCloudflareContext()
  const db = (env as unknown as Record<string, unknown>)[binding]
  if (!db)
    throw new Error(
      `D1 binding "${binding}" is missing: run \`dss db init\` or check wrangler.jsonc.`,
    )
  return drizzle(db as D1Binding, { schema })
}
