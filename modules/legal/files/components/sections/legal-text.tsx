// dss-section: legal-text/module@0.1.0
import { Container, Heading, Prose } from '@dss/ui'

export type LegalTextProps = {
  title: string
  updated: string
  blocks: readonly { heading: string; paragraphs: readonly string[] }[]
}

/**
 * @catalog Legal text (legal module): page title, last update line, then headed blocks at reading measure.
 * @props title, updated, blocks [{ heading, paragraphs[] }]
 */
export function LegalText({ title, updated, blocks }: LegalTextProps) {
  return (
    <section className="py-section">
      <Container size="prose">
        <Heading level={1} size="display-lg">
          {title}
        </Heading>
        <p className="mt-4 text-sm text-ink-muted">{updated}</p>
        <Prose className="mt-10">
          {blocks.map((block) => (
            <div key={block.heading}>
              <h2>{block.heading}</h2>
              {block.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          ))}
        </Prose>
      </Container>
    </section>
  )
}
