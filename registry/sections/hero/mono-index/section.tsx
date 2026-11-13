// dss-section: hero/mono-index@0.1.0
import type { Route } from 'next'
import Link from 'next/link'
import { Container } from '@dss/ui'

export type HeroProps = {
  title: string
  lines: readonly string[]
  links: readonly { label: string; href: Route; meta?: string }[]
}

/**
 * @catalog Mono index hero: a plain statement, a few factual lines, and an index of links with metadata. Almost no decoration.
 * @props title, lines[] (2-4 short facts), links [{ label, href, meta? }]
 */
export function Hero({ title, lines, links }: HeroProps) {
  return (
    <section className="pt-section pb-16 font-mono">
      <Container size="prose">
        <h1 className="text-heading text-balance">{title}</h1>
        <ul className="mt-8 space-y-1 text-ink-muted">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <ol className="mt-12 rule-t">
          {links.map((link, i) => (
            <li key={link.href} className="rule-b">
              <Link
                href={link.href}
                className="flex items-baseline gap-4 py-3 hover:text-accent-text"
              >
                <span aria-hidden className="text-sm text-ink-muted tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1">{link.label}</span>
                {link.meta && <span className="text-sm text-ink-muted">{link.meta}</span>}
              </Link>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
