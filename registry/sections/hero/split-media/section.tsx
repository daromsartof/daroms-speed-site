// dss-section: hero/split-media@0.1.0
import type { Route } from 'next'
import { ButtonLink, Container, Eyebrow, Heading, Media, Text } from '@dss/ui'

type Cta = { label: string; href: Route }

export type HeroProps = {
  eyebrow: string
  title: string
  body: string
  primary: Cta
  secondary?: Cta
  image: { src: string; alt: string }
  facts?: readonly string[]
}

/**
 * @catalog Split hero with a real photo: text and actions on 6 columns, image on 5 with optional fact list under the text.
 * @props eyebrow, title, body, primary, secondary?, image {src, alt}, facts? (2-3 short proofs)
 */
export function Hero({ eyebrow, title, body, primary, secondary, image, facts }: HeroProps) {
  return (
    <section className="pt-section pb-16">
      <Container className="grid items-end gap-12 md:grid-cols-12">
        <div className="md:col-span-6">
          <Eyebrow className="mb-6">{eyebrow}</Eyebrow>
          <Heading level={1} size="display-xl">
            {title}
          </Heading>
          <Text size="lg" tone="muted" className="mt-6">
            {body}
          </Text>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={primary.href}>{primary.label}</ButtonLink>
            {secondary && (
              <ButtonLink href={secondary.href} variant="secondary">
                {secondary.label}
              </ButtonLink>
            )}
          </div>
          {facts && facts.length > 0 && (
            <ul className="mt-10 grid gap-2 rule-t pt-6 text-sm text-ink-muted sm:grid-cols-3">
              {facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          )}
        </div>
        <Media
          src={image.src}
          alt={image.alt}
          ratio="portrait"
          priority
          sizes="(min-width: 768px) 40vw, 100vw"
          className="md:col-span-5 md:col-start-8"
          unoptimized={image.src.endsWith('.svg')}
        />
      </Container>
    </section>
  )
}
