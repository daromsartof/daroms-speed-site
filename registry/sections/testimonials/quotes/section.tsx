// dss-section: testimonials/quotes@0.1.0
import { Container, Eyebrow, Heading } from '@dss/ui'

export type TestimonialsProps = {
  eyebrow: string
  title?: string
  quotes: readonly { quote: string; name: string; role?: string }[]
}

/**
 * @catalog Testimonials: one large lead quote then smaller ones. Real names and roles only.
 * @props eyebrow, title?, quotes [{ quote, name, role? }]
 */
export function Testimonials({ eyebrow, title, quotes }: TestimonialsProps) {
  const [lead, ...rest] = quotes
  if (!lead) return null
  return (
    <section className="py-section">
      <Container>
        <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
        {title && <Heading level={2}>{title}</Heading>}
        <figure className="mt-12 max-w-4xl">
          <blockquote className="font-display text-display-lg text-balance">
            &ldquo;{lead.quote}&rdquo;
          </blockquote>
          <figcaption className="mt-6 text-ink-muted">
            {lead.name}
            {lead.role && <span>, {lead.role}</span>}
          </figcaption>
        </figure>
        {rest.length > 0 && (
          <div className="mt-16 grid gap-10 md:grid-cols-2">
            {rest.map((q) => (
              <figure key={q.name} className="rule-t pt-6">
                <blockquote className="text-body-lg">&ldquo;{q.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 text-sm text-ink-muted">
                  {q.name}
                  {q.role && <span>, {q.role}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
