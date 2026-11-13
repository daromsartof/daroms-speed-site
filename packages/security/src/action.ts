import { headers } from 'next/headers'
import type { z } from 'zod'
import { clientIp } from './ip.ts'
import type { RateLimiter } from './rate-limit.ts'
import { verifyTurnstile } from './turnstile.ts'

export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

export type SafeActionOptions = {
  rateLimiter?: RateLimiter
  /** Returns the Turnstile secret; when it returns a value the token is required. */
  turnstileSecret?: () => string | undefined
  /** Form field carrying the Turnstile token (widget default). */
  turnstileField?: string
  /** Hidden field that humans leave empty. */
  honeypotField?: string
  /** User-facing messages (keep them in content/ and pass them here). */
  messages?: Partial<Record<'rateLimited' | 'invalid' | 'captcha' | 'failed', string>>
}

const DEFAULT_MESSAGES = {
  rateLimited: 'Too many attempts. Please wait a moment and try again.',
  invalid: 'Please check the highlighted fields.',
  captcha: 'Verification failed. Please try again.',
  failed: 'Something went wrong. Please try again later.',
}

const CONTROL_FIELDS = new Set(['cf-turnstile-response', '$ACTION_ID', '$ACTION_REF'])

/** FormData to a plain object: repeated keys become arrays, control fields are dropped. */
export function formDataToObject(
  formData: FormData,
  skip: readonly string[] = [],
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of new Set(formData.keys())) {
    if (CONTROL_FIELDS.has(key) || key.startsWith('$ACTION') || skip.includes(key)) continue
    const values = formData.getAll(key)
    out[key] = values.length > 1 ? values : values[0]
  }
  return out
}

/**
 * Wraps a Server Action used with `useActionState`: honeypot, rate limit per IP, Turnstile,
 * zod validation, and errors that never leak internals. Every public form goes through it.
 */
export function safeAction<Schema extends z.ZodType, T>(
  schema: Schema,
  handler: (input: z.infer<Schema>, ctx: { ip: string }) => Promise<T>,
  options: SafeActionOptions = {},
): (previous: ActionResult<T> | null, formData: FormData) => Promise<ActionResult<T>> {
  const messages = { ...DEFAULT_MESSAGES, ...options.messages }
  const honeypot = options.honeypotField ?? 'company_website'
  const tokenField = options.turnstileField ?? 'cf-turnstile-response'
  return async (_previous, formData) => {
    if (String(formData.get(honeypot) ?? '') !== '') return { ok: false, error: messages.invalid }
    const ip = clientIp(await headers())
    if (options.rateLimiter && !(await options.rateLimiter.limit(ip)).success) {
      return { ok: false, error: messages.rateLimited }
    }
    const secret = options.turnstileSecret?.()
    if (secret) {
      const token = formData.get(tokenField)
      const check = await verifyTurnstile(typeof token === 'string' ? token : null, {
        secret,
        remoteip: ip,
      })
      if (!check.success) return { ok: false, error: messages.captcha }
    }
    const parsed = schema.safeParse(formDataToObject(formData, [honeypot, tokenField]))
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_form'
        ;(fieldErrors[key] ??= []).push(issue.message)
      }
      return { ok: false, error: messages.invalid, fieldErrors }
    }
    try {
      return { ok: true, data: await handler(parsed.data, { ip }) }
    } catch (error) {
      console.error('[safeAction] handler failed', error instanceof Error ? error.message : error)
      return { ok: false, error: messages.failed }
    }
  }
}
