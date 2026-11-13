import type { Metadata } from 'next'
import { pageMetadata } from '@dss/seo'
import { Hero } from '@/components/sections/hero'
import { home } from '@/content/home'
import manifest from '@/site.manifest'

export const metadata: Metadata = pageMetadata(manifest, { ...home.meta, path: '/' })

export default function HomePage() {
  return (
    <main>
      <Hero {...home.hero} />
    </main>
  )
}
