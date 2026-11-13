import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { organizationSchema, rootMetadata, websiteSchema } from '@dss/seo'
import { JsonLd } from '@dss/seo/react'
import { SkipLink } from '@dss/ui'
import { Footer } from '@/components/site/footer'
import { Header } from '@/components/site/header'
import { site } from '@/content/site'
import manifest from '@/site.manifest'
import { fontVariables } from './fonts'
import { colorScheme, dnaAttributes, themeColor } from './theme'
import './globals.css'

export const metadata: Metadata = rootMetadata(manifest, site)

export const viewport: Viewport = { themeColor, colorScheme }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={manifest.locale} className={fontVariables} {...dnaAttributes}>
      <body>
        <SkipLink label={site.header.skip} />
        <Header />
        {children}
        <Footer />
        <JsonLd
          nodes={[
            organizationSchema(manifest, site.description),
            websiteSchema(manifest, site.description),
          ]}
        />
      </body>
    </html>
  )
}
