// dss-section: testimonials/columns@0.1.0
import { Container, Eyebrow, Heading } from '@dss/ui'

export type TestimonialsProps = {
  eyebrow: string
  title?: string
  quotes: readonly { quote: string; name: string; role?: string }[]
}

/**
 * @catalog Testimonials in three ruled columns, equal weight, names and roles in small type. Real quotes only.
 * @props eyebrow, title?, quotes [{ quote, name, role? }]
 */
export function Testimonials({ eyebrow, title, quotes }: TestimonialsProps) {
  return (
    <section className="py-section">
      <Container>
        <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
        {title && <Heading level={2}>{title}</Heading>}
        <div className="reveal-stagger mt-12 grid gap-10 md:grid-cols-3">
          {quotes.slice(0, 3).map((q) => (
            <figure key={q.name} className="flex flex-col justify-between gap-6 rule-t pt-6">
              <blockquote className="text-body-lg text-pretty">&ldquo;{q.quote}&rdquo;</blockquote>
              <figcaption className="text-sm">
                <span className="block">{q.name}</span>
                {q.role && <span className="text-ink-muted">{q.role}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  )
}
