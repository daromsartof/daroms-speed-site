// dss-section: team/portraits@0.1.0
import { Container, Eyebrow, Heading, Media, Text } from '@dss/ui'

export type TeamProps = {
  eyebrow: string
  title: string
  people: readonly {
    name: string
    role: string
    bio?: string
    image: { src: string; alt: string }
  }[]
}

/**
 * @catalog Team: real portraits with name, role and one line each; staggered reveal. Named people build trust.
 * @props eyebrow, title, people [{ name, role, bio?, image {src, alt} }]
 */
export function Team({ eyebrow, title, people }: TeamProps) {
  return (
    <section className="py-section">
      <Container>
        <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
        <Heading level={2}>{title}</Heading>
        <ul className="reveal-stagger mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {people.map((person) => (
            <li key={person.name}>
              <Media
                src={person.image.src}
                alt={person.image.alt}
                ratio="portrait"
                sizes="(min-width: 1024px) 25vw, 50vw"
                unoptimized={person.image.src.endsWith('.svg')}
              />
              <p className="mt-4 font-display text-subheading">{person.name}</p>
              <p className="text-sm text-ink-muted">{person.role}</p>
              {person.bio && (
                <Text size="sm" tone="muted" className="mt-2">
                  {person.bio}
                </Text>
              )}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
