// dss-section: logos/marquee@0.1.0
import Image from 'next/image'
import { Marquee } from '@dss/motion'
import { Container } from '@dss/ui'

export type LogosProps = { label: string; logos: readonly { name: string; src?: string }[] }

/**
 * @catalog Logos strip: clients or partners looping in a CSS marquee; SVG logos (monochrome) or names set in the display face.
 * @props label (e.g. "Trusted by"), logos [{ name, src? }]
 */
export function Logos({ label, logos }: LogosProps) {
  return (
    <section className="py-12 rule-t rule-b">
      <Container className="mb-6">
        <p className="text-sm text-ink-muted">{label}</p>
      </Container>
      <Marquee label={label}>
        {logos.map((logo) =>
          logo.src ? (
            <Image
              key={logo.name}
              src={logo.src}
              alt={logo.name}
              width={120}
              height={40}
              className="h-8 w-auto opacity-80"
              unoptimized
            />
          ) : (
            <span
              key={logo.name}
              className="font-display text-heading whitespace-nowrap text-ink-muted"
            >
              {logo.name}
            </span>
          ),
        )}
      </Marquee>
    </section>
  )
}
