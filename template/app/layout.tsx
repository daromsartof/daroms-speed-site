import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { organizationSchema, rootMetadata, websiteSchema } from '@dss/seo'
import { JsonLd } from '@dss/seo/react'
import manifest from '@/site.manifest'
import { site } from '@/content/site'
import { fontVariables } from './fonts'
import { colorScheme, dnaAttributes, themeColor } from './theme'
import './globals.css'

export const metadata: Metadata = rootMetadata(manifest, site)

export const viewport: Viewport = { themeColor, colorScheme }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={manifest.locale} className={fontVariables} {...dnaAttributes}>
      <body>
        {children}
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
