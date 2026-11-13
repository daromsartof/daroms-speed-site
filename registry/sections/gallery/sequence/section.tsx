// dss-section: gallery/sequence@0.1.0
import { Container, Eyebrow, Heading, Media } from '@dss/ui'

export type GalleryProps = {
  eyebrow: string
  title: string
  images: readonly { src: string; alt: string; caption?: string }[]
}

/**
 * @catalog Image sequence: horizontal scroll-snap strip of real photos with captions (process, projects, rooms, dishes).
 * @props eyebrow, title, images [{ src, alt, caption? }]
 */
export function Gallery({ eyebrow, title, images }: GalleryProps) {
  return (
    <section className="py-section">
      <Container>
        <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
        <Heading level={2}>{title}</Heading>
      </Container>
      <ul
        className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto px-gutter pb-4"
        aria-label={title}
      >
        {images.map((image) => (
          <li
            key={image.src + image.alt}
            className="w-[80vw] max-w-xl shrink-0 snap-start md:w-[40vw]"
          >
            <figure>
              <Media
                src={image.src}
                alt={image.alt}
                ratio="landscape"
                sizes="(min-width: 768px) 40vw, 80vw"
                unoptimized={image.src.endsWith('.svg')}
              />
              {image.caption && (
                <figcaption className="mt-3 text-sm text-ink-muted">{image.caption}</figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
