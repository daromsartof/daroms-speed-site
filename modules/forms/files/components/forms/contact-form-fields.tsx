'use client'
import Script from 'next/script'
import { useActionState } from 'react'
import { Button } from '@dss/ui'
import { sendContact } from '@/server/actions/contact'

export type ContactFormCopy = {
  labels: {
    name: string
    email: string
    message: string
    submit: string
    sending: string
    honeypot: string
  }
  success: string
}

const field =
  'w-full rounded-card border border-line bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-accent aria-invalid:border-accent'

/** The form itself (client): useActionState, field errors linked to inputs, status announced politely. */
export function ContactFormFields({ copy, siteKey }: { copy: ContactFormCopy; siteKey: string }) {
  const [state, action, pending] = useActionState(sendContact, null)
  if (state?.ok) {
    return (
      <p role="status" className="text-body-lg">
        {copy.success}
      </p>
    )
  }
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {}
  const describe = (name: string) => (errors[name] ? `${name}-error` : undefined)
  const error = (name: string) =>
    errors[name] ? (
      <p id={`${name}-error`} className="mt-2 text-sm text-accent-text">
        {errors[name]?.join(' ')}
      </p>
    ) : null
  return (
    <form action={action} className="grid gap-6">
      <div>
        <label htmlFor="name" className="mb-2 block text-sm">
          {copy.labels.name}
        </label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describe('name')}
          className={field}
        />
        {error('name')}
      </div>
      <div>
        <label htmlFor="email" className="mb-2 block text-sm">
          {copy.labels.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describe('email')}
          className={field}
        />
        {error('email')}
      </div>
      <div>
        <label htmlFor="message" className="mb-2 block text-sm">
          {copy.labels.message}
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          minLength={10}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describe('message')}
          className={field}
        />
        {error('message')}
      </div>
      <div aria-hidden className="hidden">
        <label htmlFor="company_website">{copy.labels.honeypot}</label>
        <input id="company_website" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>
      {siteKey && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="afterInteractive"
          />
          <div className="cf-turnstile" data-sitekey={siteKey} />
        </>
      )}
      <p role="status" aria-live="polite" className="text-sm text-accent-text">
        {state && !state.ok ? state.error : ''}
      </p>
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? copy.labels.sending : copy.labels.submit}
      </Button>
    </form>
  )
}
