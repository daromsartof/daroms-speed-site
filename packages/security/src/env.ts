import { z } from 'zod'

/**
 * Typed, lazily validated server environment. Reading a key validates the whole schema once and
 * throws a message listing missing or invalid keys (never their values).
 *
 *   export const env = defineEnv({ RESEND_API_KEY: z.string().min(1) })
 *   env.RESEND_API_KEY
 */
export function defineEnv<Shape extends z.ZodRawShape>(
  shape: Shape,
  source: () => Record<string, string | undefined> = () => process.env,
): z.infer<z.ZodObject<Shape>> {
  const schema = z.object(shape)
  let cached: z.infer<typeof schema> | undefined
  const load = () => {
    if (cached) return cached
    const result = schema.safeParse(source())
    if (!result.success) {
      const keys = result.error.issues.map((i) => i.path.join('.')).join(', ')
      throw new Error(`Invalid or missing environment variables: ${keys}. See .env.example.`)
    }
    cached = result.data
    return cached
  }
  return new Proxy({} as z.infer<typeof schema>, {
    get: (_target, key) =>
      typeof key === 'string' ? load()[key as keyof typeof cached] : undefined,
  })
}
