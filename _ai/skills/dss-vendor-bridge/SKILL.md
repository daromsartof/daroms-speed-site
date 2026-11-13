---
name: dss-vendor-bridge
description: Interface skill - maps the vendored third-party skills (react best practices, web quality, accessibility, security, TDD, view transitions, taste) to dss commands and conventions.
---

# vendored skills, the dss way

- `vercel-react-best-practices`, `vercel-composition-patterns`: apply inside site components; server components first, no new deps.
- `web-design-guidelines`, `ecc-accessibility`: checklist for `/dss-polish` and `/dss-check`; fix with tokens and @dss/ui.
- `web-quality-skills` (Lighthouse, Core Web Vitals): budgets in `dss-performance-budget`; verify with `/dss-check`.
- `ecc-security-review`: forms, actions, env, CSP -> `safeAction`, `defineEnv`, manifest `security.csp`; never weaken headers.
- `ecc-tdd-workflow`: pure logic in `lib/` gets a Vitest test first; UI is verified by build and captures.
- `react-view-transitions`: `<ViewTransition>` from 'react' (no flag in Next 16), reduced-motion aware.
- `frontend-design`, `design-taste-frontend`: their anti-defaults match the dss avoid lists; express choices through the DNA.
