import type { Route } from 'next'
import Link from 'next/link'
import { ButtonLink, Container } from '@dss/ui'
import { site } from '@/content/site'
import manifest from '@/site.manifest'

const navItems = manifest.pages
  .filter((p) => p.nav && p.route !== '/')
  .map((p) => ({ href: p.route as Route, label: site.nav[p.route] ?? p.name }))

/** Site header: wordmark, primary nav, one action. Mobile menu is a native <details> (works without JS). */
export function Header() {
  return (
    <header className="rule-b">
      <Container className="flex items-center justify-between gap-6 py-5">
        <Link href="/" className="font-display text-xl">
          {manifest.name}
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm hover:text-accent-text">
              {item.label}
            </Link>
          ))}
          <ButtonLink href={site.header.cta.href as Route} size="sm">
            {site.header.cta.label}
          </ButtonLink>
        </nav>
        <details className="group relative md:hidden">
          <summary className="cursor-pointer list-none rounded-control border border-line px-4 py-2 text-sm">
            {site.header.menu}
          </summary>
          <nav
            aria-label="Mobile"
            className="absolute right-0 z-40 mt-2 flex w-56 flex-col gap-1 rounded-card border border-line bg-surface p-3 shadow-sm"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-control px-3 py-2 hover:bg-surface-2"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={site.header.cta.href as Route}
              className="rounded-control px-3 py-2 text-accent-text"
            >
              {site.header.cta.label}
            </Link>
          </nav>
        </details>
      </Container>
    </header>
  )
}
