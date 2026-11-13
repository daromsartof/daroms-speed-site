// Node-safe: imported by drizzle.config.ts (drizzle-kit) and the CLI.
type Driver = 'none' | 'd1' | 'libsql' | 'postgres'

export type DrizzleKitConfig = {
  dialect: 'sqlite' | 'turso' | 'postgresql'
  schema: string
  out: string
  driver?: 'd1-http'
  dbCredentials?: Record<string, string>
  strict: boolean
  verbose: boolean
}

const required = (env: Record<string, string | undefined>, keys: readonly string[]) => {
  const missing = keys.filter((k) => !env[k])
  if (missing.length) throw new Error(`drizzle-kit needs ${missing.join(', ')} (see .env.example).`)
  return Object.fromEntries(keys.map((k) => [k, env[k] as string]))
}

/**
 * drizzle-kit config for the site's driver. Generating migrations needs no credentials;
 * `migrate`/`studio` against a remote database read them from the environment.
 */
export function dssDrizzleConfig(
  manifest: { db: { driver: Driver } },
  {
    env = process.env,
    remote = false,
  }: { env?: Record<string, string | undefined>; remote?: boolean } = {},
): DrizzleKitConfig {
  const common = {
    schema: './server/db/schema.ts',
    out: './server/db/migrations',
    strict: true,
    verbose: false,
  }
  switch (manifest.db.driver) {
    case 'd1': {
      if (!remote) return { ...common, dialect: 'sqlite' }
      const c = required(env, [
        'CLOUDFLARE_ACCOUNT_ID',
        'CLOUDFLARE_D1_DATABASE_ID',
        'CLOUDFLARE_D1_TOKEN',
      ])
      return {
        ...common,
        dialect: 'sqlite',
        driver: 'd1-http',
        dbCredentials: {
          accountId: c.CLOUDFLARE_ACCOUNT_ID as string,
          databaseId: c.CLOUDFLARE_D1_DATABASE_ID as string,
          token: c.CLOUDFLARE_D1_TOKEN as string,
        },
      }
    }
    case 'libsql':
      return {
        ...common,
        dialect: 'turso',
        dbCredentials: {
          url: env.DATABASE_URL ?? 'file:./data/site.db',
          ...(env.DATABASE_AUTH_TOKEN ? { authToken: env.DATABASE_AUTH_TOKEN } : {}),
        },
      }
    case 'postgres':
      return {
        ...common,
        dialect: 'postgresql',
        dbCredentials: { url: required(env, ['DATABASE_URL']).DATABASE_URL as string },
      }
    default:
      throw new Error('site.manifest.ts has db.driver "none": run `dss db init` first.')
  }
}
