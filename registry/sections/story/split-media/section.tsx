// dss-section: story/split-media@0.1.0
import { Container, Eyebrow, Heading, Media, Text } from '@dss/ui'

export type StoryProps = {
  eyebrow: string
  title: string
  paragraphs: readonly string[]
  image: { src: string; alt: string }
  caption?: string
  reverse?: boolean
}

/**
 * @catalog Story: a real photo beside 2-3 paragraphs, optional caption. About pages, process, origin story.
 * @props eyebrow, title, paragraphs[], image {src, alt}, caption?, reverse?
 */
export function Story({ eyebrow, title, paragraphs, image, caption, reverse = false }: StoryProps) {
  return (
    <section className="py-section">
      <Container className="grid items-center gap-12 md:grid-cols-12">
        <figure className={reverse ? 'md:order-2 md:col-span-6 md:col-start-7' : 'md:col-span-6'}>
          <Media
            src={image.src}
            alt={image.alt}
            ratio="portrait"
            unoptimized={image.src.endsWith('.svg')}
          />
          {caption && <figcaption className="mt-3 text-sm text-ink-muted">{caption}</figcaption>}
        </figure>
        <div className={reverse ? 'md:col-span-5' : 'md:col-span-5 md:col-start-8'}>
          <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
          <Heading level={2}>{title}</Heading>
          <div className="mt-6 space-y-4">
            {paragraphs.map((p) => (
              <Text key={p} tone="muted">
                {p}
              </Text>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
