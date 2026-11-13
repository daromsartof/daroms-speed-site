import type { Metadata } from 'next'
import { pageMetadata } from '@dss/seo'
import { LegalText } from '@/components/sections/legal-text'
import { legal } from '@/content/legal'
import manifest from '@/site.manifest'

export const metadata: Metadata = pageMetadata(manifest, { ...legal.meta, path: '/legal' })

export default function LegalPage() {
  return (
    <main id="main">
      <LegalText {...legal.legalText} />
    </main>
  )
}
