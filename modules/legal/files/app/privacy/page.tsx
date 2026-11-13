import type { Metadata } from 'next'
import { pageMetadata } from '@dss/seo'
import { LegalText } from '@/components/sections/legal-text'
import { privacy } from '@/content/privacy'
import manifest from '@/site.manifest'

export const metadata: Metadata = pageMetadata(manifest, { ...privacy.meta, path: '/privacy' })

export default function PrivacyPage() {
  return (
    <main id="main">
      <LegalText {...privacy.legalText} />
    </main>
  )
}
