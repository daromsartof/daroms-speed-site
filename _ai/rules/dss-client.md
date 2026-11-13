---
paths:
  - "components/**/*.tsx"
---
# Client components

> "use client" only in small leaf components that need state, effects or browser APIs; pass server data down as props.

- Never import server modules (server/, @dss/security/server, @dss/data) into a client file.
- Prefer native elements first (<details>, <dialog>, CSS :has, scroll-driven animations) before adding JS.
- Radix-based primitives: `@dss/ui/accordion` (and future client subpaths). Keep bundles small: no heavy libraries for a hover.
- Effects must clean up (listeners, observers, animation frames).
