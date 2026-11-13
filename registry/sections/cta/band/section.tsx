// dss-section: cta/band@0.1.0
import type { Route } from 'next'
import { ButtonLink, Container, Heading, Text } from '@dss/ui'

export type CtaProps = { title: string; body?: string; action: { label: string; href: Route } }

/**
 * @catalog CTA band: inverse-tone block with one sentence and one action. Close a page with it, once.
 * @props title, body?, action {label, href}
 */
export function Cta({ title, body, action }: CtaProps) {
  return (
    <section className="bg-ink py-section text-surface">
      <Container className="grid gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <Heading level={2} size="display-lg">
            {title}
          </Heading>
          {body && <Text className="mt-4 text-surface/80">{body}</Text>}
        </div>
        <div className="md:col-span-4 md:text-right">
          <ButtonLink href={action.href} variant="inverse" size="lg">
            {action.label}
          </ButtonLink>
        </div>
      </Container>
    </section>
  )
}
