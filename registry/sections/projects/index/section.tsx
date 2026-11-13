// dss-section: projects/index@0.1.0
import type { Route } from 'next'
import Link from 'next/link'
import { Container, Eyebrow, Heading, Media } from '@dss/ui'

export type ProjectsProps = {
  eyebrow: string
  title: string
  items: readonly {
    name: string
    type: string
    place?: string
    year: string
    image: { src: string; alt: string }
    href?: Route
  }[]
}

/**
 * @catalog Projects index: first project large with image, the rest as a ruled table (name, type, place, year).
 * @props eyebrow, title, items [{ name, type, place?, year, image {src, alt}, href? }]
 */
export function Projects({ eyebrow, title, items }: ProjectsProps) {
  const [lead, ...rest] = items
  if (!lead) return null
  return (
    <section id="work" className="py-section">
      <Container>
        <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
        <Heading level={2}>{title}</Heading>
        <figure className="mt-12">
          <Media
            src={lead.image.src}
            alt={lead.image.alt}
            ratio="wide"
            sizes="100vw"
            unoptimized={lead.image.src.endsWith('.svg')}
          />
          <figcaption className="mt-4 flex flex-wrap justify-between gap-2">
            <span className="font-display text-heading">{lead.name}</span>
            <span className="text-ink-muted">
              {[lead.type, lead.place, lead.year].filter(Boolean).join(' · ')}
            </span>
          </figcaption>
        </figure>
        <table className="mt-12 w-full text-left">
          <caption className="sr-only">{title}</caption>
          <tbody>
            {rest.map((p) => (
              <tr key={p.name} className="rule-t">
                <th scope="row" className="py-4 font-normal">
                  {p.href ? (
                    <Link href={p.href} className="hover:text-accent-text">
                      {p.name}
                    </Link>
                  ) : (
                    p.name
                  )}
                </th>
                <td className="hidden py-4 text-ink-muted md:table-cell">{p.type}</td>
                <td className="hidden py-4 text-ink-muted md:table-cell">{p.place}</td>
                <td className="py-4 text-right text-ink-muted tabular-nums">{p.year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Container>
    </section>
  )
}
