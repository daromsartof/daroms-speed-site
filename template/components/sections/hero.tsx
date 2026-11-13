import type { Route } from 'next'
import Link from 'next/link'

type Cta = { label: string; href: Route }

/**
 * @catalog Split editorial hero: oversized display title left, short body and two actions right.
 * @props eyebrow, title, body, primary {label, href}, secondary {label, href}
 */
export function Hero({
  eyebrow,
  title,
  body,
  primary,
  secondary,
}: {
  eyebrow: string
  title: string
  body: string
  primary: Cta
  secondary: Cta
}) {
  return (
    <section className="mx-auto grid max-w-content gap-10 px-gutter pt-section pb-20 md:grid-cols-12">
      <div className="md:col-span-8">
        <p className="mb-6 text-sm tracking-wide text-ink-muted">{eyebrow}</p>
        <h1 className="font-display text-display-2xl font-light text-balance">{title}</h1>
      </div>
      <div className="flex flex-col justify-end gap-8 md:col-span-4">
        <p className="text-body-lg text-pretty text-ink-muted">{body}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={primary.href}
            className="rounded-control bg-accent px-6 py-3 text-accent-ink transition-transform duration-(--duration-brand) ease-brand hover:-translate-y-0.5"
          >
            {primary.label}
          </Link>
          <Link
            href={secondary.href}
            className="rounded-control border border-line px-6 py-3 transition-colors hover:bg-surface-2"
          >
            {secondary.label}
          </Link>
        </div>
      </div>
    </section>
  )
}
