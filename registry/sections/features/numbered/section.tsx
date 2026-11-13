// dss-section: features/numbered@0.1.0
import { Container, Eyebrow, Heading, Text } from '@dss/ui'

export type FeaturesProps = {
  eyebrow: string
  title: string
  intro?: string
  items: readonly { title: string; body: string }[]
}

/**
 * @catalog Features as a ruled list with index numbers: title column left, items right. Use for 3-6 real differentiators.
 * @props eyebrow, title, intro?, items [{ title, body }]
 */
export function Features({ eyebrow, title, intro, items }: FeaturesProps) {
  return (
    <section id="features" className="py-section">
      <Container className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
          <Heading level={2}>{title}</Heading>
          {intro && (
            <Text tone="muted" className="mt-6">
              {intro}
            </Text>
          )}
        </div>
        <ol className="rule-b md:col-span-7 md:col-start-6">
          {items.map((item, i) => (
            <li key={item.title} className="grid grid-cols-[3rem_1fr] gap-4 rule-t py-8">
              <span aria-hidden className="font-mono text-sm text-accent-text tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <Heading level={3} size="subheading">
                  {item.title}
                </Heading>
                <Text tone="muted" className="mt-2">
                  {item.body}
                </Text>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
