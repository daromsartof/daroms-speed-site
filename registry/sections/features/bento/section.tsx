// dss-section: features/bento@0.1.0
import { Container, Eyebrow, Heading, Text } from '@dss/ui'

export type FeaturesProps = {
  eyebrow: string
  title: string
  items: readonly { title: string; body: string; detail?: string }[]
}

const SPANS = [
  'md:col-span-4 md:row-span-2',
  'md:col-span-2',
  'md:col-span-2',
  'md:col-span-3',
  'md:col-span-3',
]

/**
 * @catalog Bento features: 3-5 uneven tiles (first one large), each a real capability with an optional metric. Not equal cards.
 * @props eyebrow, title, items [{ title, body, detail? }]
 */
export function Features({ eyebrow, title, items }: FeaturesProps) {
  return (
    <section id="features" className="py-section">
      <Container>
        <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
        <Heading level={2} className="max-w-3xl">
          {title}
        </Heading>
        <div className="reveal-stagger mt-14 grid auto-rows-[minmax(12rem,auto)] gap-4 md:grid-cols-6">
          {items.slice(0, 5).map((item, i) => (
            <article
              key={item.title}
              className={`flex flex-col justify-between rounded-card border border-line p-6 ${i === 0 ? 'bg-surface-2' : ''} ${SPANS[i] ?? ''}`}
            >
              <Heading level={3} size={i === 0 ? 'heading' : 'subheading'}>
                {item.title}
              </Heading>
              <div className="mt-6">
                {item.detail && (
                  <p className="font-display text-display-lg text-accent-text">{item.detail}</p>
                )}
                <Text tone="muted" className="mt-2">
                  {item.body}
                </Text>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
