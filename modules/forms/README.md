# forms: contact form

> A contact form section on /contact (or `--page`), a Server Action through safeAction, email via Resend.

- Files (site-owned): `server/actions/contact.ts`, `server/forms.ts`, `components/forms/contact-form-fields.tsx`,
  `components/sections/contact-form.tsx`. Copy lives in the page content file under `contactForm`.
- Env (`.env.example`): RESEND_API_KEY, CONTACT_TO, CONTACT_FROM (a sender verified in Resend), optional Turnstile keys.
  Cloudflare: `wrangler secret put RESEND_API_KEY` (and the others); the user types the values.
- Protection: honeypot, per-instance rate limit, Turnstile when TURNSTILE_SECRET_KEY is set (CSP preset `turnstile` added).
- More fields: extend the zod schema and the form together; keep labels in content.
