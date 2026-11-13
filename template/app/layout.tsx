import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { site } from '@/content/site'
import { fontVariables } from './fonts'
import { themeColor } from './theme'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: site.name, url: site.url, locale: site.locale },
  twitter: { card: 'summary_large_image' },
  formatDetection: { email: false, address: false, telephone: false },
}

export const viewport: Viewport = { themeColor }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={site.locale} className={fontVariables}>
      <body>{children}</body>
    </html>
  )
}
