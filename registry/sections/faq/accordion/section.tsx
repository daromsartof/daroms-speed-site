// dss-section: faq/accordion@0.1.0
import { faqSchema } from '@dss/seo'
import { JsonLd } from '@dss/seo/react'
import { Accordion } from '@dss/ui/accordion'
import { Container, Eyebrow, Heading } from '@dss/ui'

export type FaqProps = {
  eyebrow: string
  title: string
  items: readonly { question: string; answer: string }[]
}

/**
 * @catalog FAQ: accessible accordion plus FAQPage JSON-LD. Real questions from clients, short answers.
 * @props eyebrow, title, items [{ question, answer }]
 */
export function Faq({ eyebrow, title, items }: FaqProps) {
  return (
    <section id="faq" className="py-section">
      <Container className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
          <Heading level={2}>{title}</Heading>
        </div>
        <Accordion items={items} className="md:col-span-8" />
      </Container>
      <JsonLd nodes={[faqSchema(items)]} />
    </section>
  )
}
