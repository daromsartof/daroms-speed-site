// dss-section: hero/scene@0.1.0
import type { Route } from 'next'
import { SplitWords } from '@dss/motion'
import { ButtonLink, Container, Eyebrow, Text } from '@dss/ui'
import { GradientScene } from '@/components/3d/gradient'

type Cta = { label: string; href: Route }

export type HeroProps = {
  eyebrow: string
  title: string
  body: string
  primary: Cta
  secondary?: Cta
  sceneLabel: string
}

/**
 * @catalog Hero with a 3D scene in a framed panel beside the text (never behind it); the title reveals word by word.
 * @props eyebrow, title, body, primary, secondary?, sceneLabel (what the scene shows, for screen readers)
 */
export function Hero({ eyebrow, title, body, primary, secondary, sceneLabel }: HeroProps) {
  return (
    <section className="pt-section pb-16">
      <Container className="grid items-center gap-12 md:grid-cols-12">
        <div className="md:col-span-7">
          <Eyebrow className="mb-6">{eyebrow}</Eyebrow>
          <SplitWords as="h1" text={title} className="font-display text-display-xl text-balance" />
          <Text size="lg" tone="muted" className="mt-8 max-w-xl">
            {body}
          </Text>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={primary.href}>{primary.label}</ButtonLink>
            {secondary && (
              <ButtonLink href={secondary.href} variant="secondary">
                {secondary.label}
              </ButtonLink>
            )}
          </div>
        </div>
        <GradientScene
          label={sceneLabel}
          className="aspect-square rounded-media border border-line md:col-span-5"
        />
      </Container>
    </section>
  )
}
