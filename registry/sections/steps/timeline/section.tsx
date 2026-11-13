// dss-section: steps/timeline@0.1.0
import { Container, Eyebrow, Heading, Text } from '@dss/ui'

export type StepsProps = {
  eyebrow: string
  title: string
  steps: readonly { title: string; body: string; duration?: string }[]
}

/**
 * @catalog Steps: a real sequence (process, onboarding, how it works) on a horizontal timeline from md up.
 * @props eyebrow, title, steps [{ title, body, duration? }]
 */
export function Steps({ eyebrow, title, steps }: StepsProps) {
  return (
    <section id="process" className="py-section">
      <Container>
        <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
        <Heading level={2} className="max-w-3xl">
          {title}
        </Heading>
        <ol className="mt-14 grid gap-10 md:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
          {steps.map((step, i) => (
            <li key={step.title} className="relative rule-t pt-6">
              <span
                aria-hidden
                className="absolute -top-1.5 left-0 size-3 rounded-full bg-accent ring-4 ring-surface"
              />
              <p className="text-sm text-ink-muted">
                {i + 1}
                {step.duration && <span> · {step.duration}</span>}
              </p>
              <Heading level={3} size="subheading" className="mt-2">
                {step.title}
              </Heading>
              <Text tone="muted" className="mt-2">
                {step.body}
              </Text>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
