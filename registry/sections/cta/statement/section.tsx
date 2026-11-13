// dss-section: cta/statement@0.1.0
import type { Route } from 'next'
import Link from 'next/link'
import { Container, Text } from '@dss/ui'

export type CtaProps = { title: string; body?: string; action: { label: string; href: Route } }

/**
 * @catalog CTA statement: the whole sentence is a large link in the display face, quiet body under it. Ends a page with restraint.
 * @props title (the sentence, becomes the link text), body?, action {label (accessible name), href}
 */
export function Cta({ title, body, action }: CtaProps) {
  return (
    <section className="py-section rule-t">
      <Container>
        <Link
          href={action.href}
          aria-label={action.label}
          className="group block max-w-5xl font-display text-display-xl text-balance"
        >
          <span className="underline decoration-line decoration-1 underline-offset-[0.2em] transition-colors duration-(--duration-brand) ease-brand group-hover:decoration-accent">
            {title}
          </span>
          <span
            aria-hidden
            className="ml-4 inline-block text-accent-text transition-transform duration-(--duration-brand) ease-brand group-hover:translate-x-2"
          >
            &rarr;
          </span>
        </Link>
        {body && (
          <Text tone="muted" className="mt-6 max-w-xl">
            {body}
          </Text>
        )}
      </Container>
    </section>
  )
}
