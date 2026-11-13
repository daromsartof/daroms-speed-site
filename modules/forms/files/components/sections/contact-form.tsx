// dss-section: contact-form/module@0.1.0
import { Container, Eyebrow, Heading, Text } from '@dss/ui'
import { ContactFormFields, type ContactFormCopy } from '@/components/forms/contact-form-fields'
import { turnstileSiteKey } from '@/server/forms'

export type ContactFormProps = {
  eyebrow: string
  title: string
  intro: string
  form: ContactFormCopy
}

/**
 * @catalog Contact form section (forms module): heading and intro left, accessible form right; sends through server/actions/contact.ts.
 * @props eyebrow, title, intro, form { labels {name, email, message, submit, sending, honeypot}, success }
 */
export function ContactForm({ eyebrow, title, intro, form }: ContactFormProps) {
  return (
    <section id="contact-form" className="py-section">
      <Container className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
          <Heading level={2}>{title}</Heading>
          <Text tone="muted" className="mt-6">
            {intro}
          </Text>
        </div>
        <div className="md:col-span-7 md:col-start-6">
          <ContactFormFields copy={form} siteKey={turnstileSiteKey} />
        </div>
      </Container>
    </section>
  )
}
