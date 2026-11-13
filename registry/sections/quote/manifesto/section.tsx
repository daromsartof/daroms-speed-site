// dss-section: quote/manifesto@0.1.0
import { Container } from '@dss/ui'

export type ManifestoProps = { statement: string; highlight?: string; attribution?: string }

/**
 * @catalog Manifesto: one large paragraph stating a belief, one phrase in the accent, revealed on scroll. A pause between sections.
 * @props statement, highlight? (exact phrase inside the statement), attribution?
 */
export function Manifesto({ statement, highlight, attribution }: ManifestoProps) {
  const [before, after] =
    highlight && statement.includes(highlight) ? statement.split(highlight) : [statement, undefined]
  return (
    <section className="py-section">
      <Container>
        <blockquote className="reveal max-w-5xl font-display text-display-lg text-balance">
          {before}
          {after !== undefined && <span className="text-accent-text">{highlight}</span>}
          {after}
        </blockquote>
        {attribution && <p className="mt-8 text-ink-muted">{attribution}</p>}
      </Container>
    </section>
  )
}
