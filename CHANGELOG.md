# Changelog

All notable changes to daroms-speed-site. Versions follow `VERSION`.

## 0.1.0 (unreleased)

- Repository skeleton: pnpm workspace, `@dss/config` (strict TypeScript base with type-stripping-safe flags,
  shared flat ESLint config for core and sites, Prettier), Vitest, CI.
- Golden site template (Next 16.4.6, React 19.3, Tailwind v4 with explicit sources, typed routes, static CSP and
  security headers, copy in `content/`, generated `fonts.ts`/`theme.css`/`theme.ts` placeholders, exact Next
  `AGENTS.md` block). Verified: all routes static, OpenNext Cloudflare build + `wrangler deploy --dry-run`
  (static-assets incremental cache, ~1 MiB gzip worker), local workerd serving headers, Docker standalone image,
  `core/` attached as a git submodule, `cacheComponents` on and off.
