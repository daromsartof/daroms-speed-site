const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export type TurnstileResult = { success: boolean; errors: string[] }

/** Verifies a Cloudflare Turnstile token server-side. Never trust the widget alone. */
export async function verifyTurnstile(
  token: string | null | undefined,
  {
    secret,
    remoteip,
    fetchFn = fetch,
  }: { secret: string; remoteip?: string; fetchFn?: typeof fetch },
): Promise<TurnstileResult> {
  if (!token) return { success: false, errors: ['missing-input-response'] }
  const body = new URLSearchParams({ secret, response: token })
  if (remoteip && remoteip !== 'unknown') body.set('remoteip', remoteip)
  try {
    const res = await fetchFn(VERIFY_URL, { method: 'POST', body })
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
    return { success: data.success === true, errors: data['error-codes'] ?? [] }
  } catch {
    return { success: false, errors: ['verify-request-failed'] }
  }
}
