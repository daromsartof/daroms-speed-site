import type { Manifest } from '@dss/site/config'

/** Canonical path for the site's trailing-slash policy ("/" stays "/"). */
export function canonicalPath(manifest: Manifest, path: string): string {
  const [pathname = '/', rest = ''] = path.split(/(?=[?#])/)
  const clean = pathname.replace(/\/+$/, '') || '/'
  const withSlash = clean === '/' ? '/' : manifest.seo.trailingSlash ? `${clean}/` : clean
  return `${withSlash}${rest}`
}

export function absoluteUrl(manifest: Manifest, path = '/'): string {
  return `${manifest.url}${canonicalPath(manifest, path)}`
}
