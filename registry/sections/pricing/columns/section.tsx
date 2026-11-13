// dss-section: pricing/columns@0.1.0
import type { Route } from 'next'
import { ButtonLink, Container, Eyebrow, Heading, Text } from '@dss/ui'

export type PricingProps = {
  eyebrow: string
  title: string
  note?: string
  plans: readonly {
    name: string
    price: string
    period?: string
    summary: string
    features: readonly string[]
    action: { label: string; href: Route }
    featured?: boolean
  }[]
}

/**
 * @catalog Pricing columns: 2-3 plans side by side on rules, one optionally featured in the accent; real prices only.
 * @props eyebrow, title, note?, plans [{ name, price, period?, summary, features[], action, featured? }]
 */
export function Pricing({ eyebrow, title, note, plans }: PricingProps) {
  return (
    <section id="pricing" className="py-section">
      <Container>
        <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
        <Heading level={2}>{title}</Heading>
        <div className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`flex flex-col gap-6 p-8 ${plan.featured ? 'bg-surface-2' : 'bg-surface'}`}
            >
              <div>
                <Heading level={3} size="subheading">
                  {plan.name}
                </Heading>
                <p className="mt-4">
                  <span className="font-display text-display-lg">{plan.price}</span>
                  {plan.period && <span className="ml-2 text-ink-muted">{plan.period}</span>}
                </p>
                <Text tone="muted" className="mt-2">
                  {plan.summary}
                </Text>
              </div>
              <ul className="flex-1 space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span aria-hidden className="text-accent-text">
                      +
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <ButtonLink href={plan.action.href} variant={plan.featured ? 'primary' : 'secondary'}>
                {plan.action.label}
              </ButtonLink>
            </article>
          ))}
        </div>
        {note && (
          <Text size="sm" tone="muted" className="mt-6">
            {note}
          </Text>
        )}
      </Container>
    </section>
  )
}
