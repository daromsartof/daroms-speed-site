'use client'
import { Accordion as Primitive } from 'radix-ui'
import { cx } from './cx.ts'

/**
 * @catalog Accordion (client): accessible disclosure list, FAQ default. Pair with faqSchema() from @dss/seo.
 * @props items [{ question, answer }], defaultOpen (index), className
 */
export function Accordion({
  items,
  defaultOpen,
  className,
}: {
  items: readonly { question: string; answer: string }[]
  defaultOpen?: number
  className?: string
}) {
  return (
    <Primitive.Root
      type="single"
      collapsible
      defaultValue={defaultOpen === undefined ? undefined : `item-${defaultOpen}`}
      className={cx('divide-y divide-line rule-t rule-b', className)}
    >
      {items.map((item, i) => (
        <Primitive.Item key={item.question} value={`item-${i}`}>
          <Primitive.Header>
            <Primitive.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left text-subheading">
              {item.question}
              <span
                aria-hidden
                className="text-accent-text transition-transform duration-(--duration-brand) ease-brand group-data-[state=open]:rotate-45"
              >
                +
              </span>
            </Primitive.Trigger>
          </Primitive.Header>
          <Primitive.Content className="overflow-hidden pb-6 text-ink-muted data-[state=closed]:hidden">
            {item.answer}
          </Primitive.Content>
        </Primitive.Item>
      ))}
    </Primitive.Root>
  )
}
