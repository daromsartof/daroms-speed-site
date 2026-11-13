// dss-section: contact/details@0.1.0
import { Container, Eyebrow, Heading, Text } from '@dss/ui'

export type ContactProps = {
  eyebrow: string
  title: string
  body: string
  channels: readonly { label: string; value: string; href?: string }[]
  hours?: readonly { days: string; time: string }[]
}

/**
 * @catalog Contact details: channels (email, phone, address) and opening hours. Add the forms module for a form.
 * @props eyebrow, title, body, channels [{ label, value, href? }], hours? [{ days, time }]
 */
export function Contact({ eyebrow, title, body, channels, hours }: ContactProps) {
  return (
    <section id="contact" className="py-section">
      <Container className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
          <Heading level={1} size="display-xl">
            {title}
          </Heading>
          <Text size="lg" tone="muted" className="mt-6">
            {body}
          </Text>
        </div>
        <div className="space-y-10 md:col-span-6 md:col-start-7">
          <dl className="rule-b">
            {channels.map((c) => (
              <div key={c.label} className="grid grid-cols-3 gap-4 rule-t py-5">
                <dt className="text-sm text-ink-muted">{c.label}</dt>
                <dd className="col-span-2">
                  {c.href ? (
                    <a href={c.href} className="underline-offset-4 hover:underline">
                      {c.value}
                    </a>
                  ) : (
                    c.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {hours && hours.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {hours.map((h) => (
                <div key={h.days} className="contents">
                  <dt className="text-ink-muted">{h.days}</dt>
                  <dd>{h.time}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </Container>
    </section>
  )
}
