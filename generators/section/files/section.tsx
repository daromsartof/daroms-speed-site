// dss-section: bespoke/{{name}}
import { Container, Heading, Text } from '@dss/ui'

export type {{Name}}Props = { title: string; body: string }

/**
 * @catalog {{Name}}: [what this section shows and when to use it].
 * @props title, body
 */
export function {{Name}}({ title, body }: {{Name}}Props) {
  return (
    <section className="py-section">
      <Container>
        <Heading level={2}>{title}</Heading>
        <Text tone="muted" className="mt-6">
          {body}
        </Text>
      </Container>
    </section>
  )
}
