# analytics: cookieless audience measurement

> Plausible (default), Umami or Cloudflare Web Analytics through `manifest.modules.analytics`; production builds only.

- `pnpm dss module add analytics --config provider=umami,websiteId=<id>` (CSP preset follows the provider).
- Plausible needs the site added in its dashboard; Cloudflare needs `token`. Self-hosted: set `src` and add its origin to
  `security.csp.scriptSrc` and `connectSrc` in the manifest.
- Mention the provider in the privacy page (legal module).
