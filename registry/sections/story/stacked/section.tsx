// dss-section: story/stacked@0.1.0
import { Container, Eyebrow, Heading, Media, Text } from '@dss/ui'

export type StoryProps = {
  eyebrow: string
  title: string
  paragraphs: readonly string[]
  image: { src: string; alt: string }
  caption?: string
}

/**
 * @catalog Stacked story: title and two text columns, then one wide image with caption. Reads like a magazine spread.
 * @props eyebrow, title, paragraphs[] (2), image {src, alt}, caption?
 */
export function Story({ eyebrow, title, paragraphs, image, caption }: StoryProps) {
  return (
    <section className="py-section">
      <Container>
        <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
        <Heading level={2} className="max-w-4xl">
          {title}
        </Heading>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {paragraphs.map((p) => (
            <Text key={p} tone="muted">
              {p}
            </Text>
          ))}
        </div>
        <figure className="reveal mt-14">
          <Media
            src={image.src}
            alt={image.alt}
            ratio="wide"
            sizes="100vw"
            unoptimized={image.src.endsWith('.svg')}
          />
          {caption && <figcaption className="mt-3 text-sm text-ink-muted">{caption}</figcaption>}
        </figure>
      </Container>
    </section>
  )
}
