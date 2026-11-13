// dss-section: services/rows@0.1.0
import type { Route } from 'next'
import Link from 'next/link'
import { Container, Eyebrow, Heading, Text } from '@dss/ui'

export type ServicesProps = {
  eyebrow: string
  title: string
  items: readonly { name: string; summary: string; detail?: string; href?: Route }[]
}

/**
 * @catalog Services as full-width rows (name, summary, optional link): reads like a menu, not a card grid.
 * @props eyebrow, title, items [{ name, summary, detail?, href? }]
 */
export function Services({ eyebrow, title, items }: ServicesProps) {
  return (
    <section id="services" className="py-section">
      <Container>
        <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
        <Heading level={2} className="max-w-3xl">
          {title}
        </Heading>
        <ul className="mt-14 rule-b">
          {items.map((item) => {
            const row = (
              <div className="grid gap-3 rule-t py-8 md:grid-cols-12 md:items-baseline">
                <Heading level={3} size="heading" className="md:col-span-5">
                  {item.name}
                </Heading>
                <Text tone="muted" className="md:col-span-5">
                  {item.summary}
                  {item.detail && <span className="mt-2 block text-sm">{item.detail}</span>}
                </Text>
                {item.href && (
                  <span aria-hidden className="text-accent-text md:col-span-2 md:text-right">
                    &rarr;
                  </span>
                )}
              </div>
            )
            return (
              <li key={item.name}>
                {item.href ? (
                  <Link href={item.href} className="block transition-colors hover:bg-surface-2">
                    {row}
                  </Link>
                ) : (
                  row
                )}
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
