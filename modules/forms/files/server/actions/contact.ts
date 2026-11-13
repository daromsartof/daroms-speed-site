'use server'
import { z } from 'zod'
import { defineEnv, memoryRateLimiter, safeAction } from '@dss/security/server'

const env = defineEnv({
  RESEND_API_KEY: z.string().min(1),
  CONTACT_TO: z.email(),
  CONTACT_FROM: z.string().min(3),
})

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email(),
  message: z.string().trim().min(10).max(5000),
})

// Per-instance limiter; Turnstile is the main protection on serverless and Workers.
const limiter = memoryRateLimiter({ limit: 5, windowMs: 10 * 60_000 })

/** Sends the contact message by email (Resend REST API, no SDK). */
export const sendContact = safeAction(
  schema,
  async (input) => {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
        reply_to: input.email,
        subject: `Website message from ${input.name}`,
        text: `${input.message}\n\n${input.name} <${input.email}>`,
      }),
    })
    if (!res.ok) throw new Error(`Resend responded ${res.status}`)
    return { sent: true }
  },
  { rateLimiter: limiter, turnstileSecret: () => process.env.TURNSTILE_SECRET_KEY || undefined },
)
