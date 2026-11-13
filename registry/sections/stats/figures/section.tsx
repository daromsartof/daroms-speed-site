// dss-section: stats/figures@0.1.0
import { Container, Text } from '@dss/ui'

export type StatsProps = { items: readonly { value: string; label: string }[]; note?: string }

/**
 * @catalog Stats: 2-4 verifiable figures in display type with labels. Never invent numbers.
 * @props items [{ value, label }], note? (source or date)
 */
export function Stats({ items, note }: StatsProps) {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <dl className="grid grid-cols-2 gap-y-10 rule-t pt-10 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.label}>
              <dt className="sr-only">{item.label}</dt>
              <dd>
                <span className="block font-display text-display-lg tabular-nums">
                  {item.value}
                </span>
                <span aria-hidden className="mt-2 block text-sm text-ink-muted">
                  {item.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
        {note && (
          <Text size="sm" tone="muted" className="mt-8">
            {note}
          </Text>
        )}
      </Container>
    </section>
  )
}
