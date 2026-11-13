// dss-section: hero/kinetic@0.1.0
import type { Route } from 'next'
import { Marquee } from '@dss/motion'
import { ButtonLink, Container, Text } from '@dss/ui'

export type HeroProps = {
  title: string
  words: readonly string[]
  body: string
  primary: { label: string; href: Route }
}

/**
 * @catalog Kinetic hero: viewport-wide words looping in a marquee above a short statement. Typography is the image.
 * @props title (h1, visually the statement), words[] (3-6 single words for the loop), body, primary
 */
export function Hero({ title, words, body, primary }: HeroProps) {
  return (
    <section className="overflow-hidden pt-16 pb-section">
      <Marquee label={words.join(', ')} className="rule-b pb-6">
        {words.map((word) => (
          <span key={word} className="font-display text-display-2xl leading-none whitespace-nowrap">
            {word}
            <span aria-hidden className="ml-12 text-accent-text">
              *
            </span>
          </span>
        ))}
      </Marquee>
      <Container className="mt-14 grid gap-10 md:grid-cols-12">
        <h1 className="font-display text-display-lg text-balance md:col-span-7">{title}</h1>
        <div className="flex flex-col gap-8 md:col-span-4 md:col-start-9">
          <Text size="lg" tone="muted">
            {body}
          </Text>
          <ButtonLink href={primary.href} size="lg" className="self-start">
            {primary.label}
          </ButtonLink>
        </div>
      </Container>
    </section>
  )
}
