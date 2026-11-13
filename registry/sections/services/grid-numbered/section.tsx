// dss-section: services/grid-numbered@0.1.0
import type { Route } from 'next'
import Link from 'next/link'
import { Container, Eyebrow, Heading, Text } from '@dss/ui'

export type ServicesProps = {
  eyebrow: string
  title: string
  items: readonly { name: string; summary: string; detail?: string; href?: Route }[]
}

/**
 * @catalog Services as a two-column numbered grid on rules: index, name, summary, price line. Rational and scannable.
 * @props eyebrow, title, items [{ name, summary, detail?, href? }]
 */
export function Services({ eyebrow, title, items }: ServicesProps) {
  return (
    <section id="services" className="py-section">
      <Container>
        <div className="grid gap-6 md:grid-cols-12">
          <Eyebrow className="md:col-span-3">{eyebrow}</Eyebrow>
          <Heading level={2} className="md:col-span-8">
            {title}
          </Heading>
        </div>
        <ol className="mt-14 grid gap-x-12 md:grid-cols-2">
          {items.map((item, i) => (
            <li key={item.name} className="grid grid-cols-[3.5rem_1fr] gap-4 rule-t py-8">
              <span aria-hidden className="font-display text-heading text-accent-text tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <Heading level={3} size="subheading">
                  {item.href ? (
                    <Link href={item.href} className="hover:text-accent-text">
                      {item.name}
                    </Link>
                  ) : (
                    item.name
                  )}
                </Heading>
                <Text tone="muted" className="mt-2">
                  {item.summary}
                </Text>
                {item.detail && <p className="mt-3 text-sm">{item.detail}</p>}
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
