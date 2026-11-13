// dss-section: hero/fullbleed-image@0.1.0
import type { Route } from 'next'
import Image from 'next/image'
import { ButtonLink, Container, Text } from '@dss/ui'

export type HeroProps = {
  title: string
  body: string
  image: { src: string; alt: string }
  primary: { label: string; href: Route }
  caption?: string
}

/**
 * @catalog Full-bleed photo hero: one strong image edge to edge, text on an ink scrim at the bottom left. The image is the LCP: real photo only.
 * @props title, body, image {src, alt}, primary, caption?
 */
export function Hero({ title, body, image, primary, caption }: HeroProps) {
  return (
    <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover"
        unoptimized={image.src.endsWith('.svg')}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-t from-ink/85 via-ink/40 to-transparent"
      />
      <Container className="pt-40 pb-16 text-surface">
        <h1 className="max-w-4xl font-display text-display-xl text-balance">{title}</h1>
        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Text size="lg" className="max-w-xl text-surface/85">
            {body}
          </Text>
          <ButtonLink href={primary.href} variant="inverse" size="lg">
            {primary.label}
          </ButtonLink>
        </div>
        {caption && <p className="mt-10 text-sm text-surface/70">{caption}</p>}
      </Container>
    </section>
  )
}
