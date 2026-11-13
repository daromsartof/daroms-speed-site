# Performance budget

> LCP < 2.0s, CLS < 0.05, INP < 200ms on mobile; Lighthouse >= 90 performance and >= 95 accessibility, best practices, SEO.

- LCP element is text or a priority image, never a canvas or video. Fonts through next/font (already self-hosted).
- Client JS per page: keep under 100 KB gzip excluding lazy 3D; check `pnpm build` output.
- Audit: `npx lighthouse <url> --form-factor=mobile` against `pnpm start`.
