export type DeployEnv = 'production' | 'preview' | 'development'

/**
 * Which environment this build serves. Previews must never be indexed: `dss deploy --preview`
 * sets DSS_ENV=preview, Vercel sets VERCEL_ENV. Self-hosted production builds need nothing.
 */
export function deployEnv(env: Record<string, string | undefined> = process.env): DeployEnv {
  const explicit = env.DSS_ENV
  if (explicit === 'production' || explicit === 'preview' || explicit === 'development')
    return explicit
  if (env.VERCEL_ENV) return env.VERCEL_ENV === 'production' ? 'production' : 'preview'
  return env.NODE_ENV === 'production' ? 'production' : 'development'
}

export const isIndexable = (env?: Record<string, string | undefined>) =>
  deployEnv(env) === 'production'
