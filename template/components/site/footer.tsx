import type { Route } from 'next'
import Link from 'next/link'
import { Container, Text } from '@dss/ui'
import { site } from '@/content/site'
import manifest from '@/site.manifest'

/** Site footer: name, tagline, nav, legal line and the studio credit link. The year is set at build time. */
export function Footer() {
  const links = manifest.pages.filter((p) => p.nav || p.footer)
  return (
    <footer className="rule-t py-16">
      <Container className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-heading">{manifest.name}</p>
          <Text tone="muted" className="mt-3 max-w-sm">
            {site.tagline}
          </Text>
        </div>
        <nav aria-label="Footer" className="md:col-span-4 md:col-start-8">
          <ul className="grid grid-cols-2 gap-3 text-sm">
            {links.map((p) => (
              <li key={p.route}>
                <Link href={p.route as Route} className="hover:text-accent-text">
                  {site.nav[p.route] ?? p.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 md:col-span-12">
          <Text size="sm" tone="muted">
            © {new Date().getFullYear()} {site.footer.legal}. {site.footer.note}
          </Text>
          <a
            href={site.footer.credit.href}
            className="inline-flex min-h-11 items-center text-sm text-ink-muted underline-offset-4 hover:text-accent-text hover:underline"
          >
            {site.footer.credit.label}
          </a>
        </div>
      </Container>
    </footer>
  )
}
