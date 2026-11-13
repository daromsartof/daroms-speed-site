// dss-section: hero/split-editorial@0.1.0
import type { Route } from 'next'
import { ButtonLink, Container, Eyebrow, Heading, Text } from '@dss/ui'

type Cta = { label: string; href: Route }

export type HeroProps = {
  eyebrow: string
  title: string
  body: string
  primary: Cta
  secondary?: Cta
}

/**
 * @catalog Split editorial hero: oversized display title on 8 columns, short body and actions on 4.
 * @props eyebrow, title, body, primary {label, href}, secondary? {label, href}
 */
export function Hero({ eyebrow, title, body, primary, secondary }: HeroProps) {
  return (
    <section className="pt-section pb-16 md:pb-24">
      <Container className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-8">
          <Eyebrow className="mb-6">{eyebrow}</Eyebrow>
          <Heading level={1} size="display-2xl" className="font-light">
            {title}
          </Heading>
        </div>
        <div className="flex flex-col justify-end gap-8 md:col-span-4">
          <Text size="lg" tone="muted">
            {body}
          </Text>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={primary.href}>{primary.label}</ButtonLink>
            {secondary && (
              <ButtonLink href={secondary.href} variant="secondary">
                {secondary.label}
              </ButtonLink>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
