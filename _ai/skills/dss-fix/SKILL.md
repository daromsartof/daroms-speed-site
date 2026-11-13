---
name: dss-fix
description: Fixes a build, type, lint, runtime or hydration error - reads the exact error, finds the root cause, applies the smallest correct fix, verifies.
argument-hint: "<error or symptom>"
---

# /dss-fix: root cause, small fix

Problem: $ARGUMENTS

1. Reproduce once with the narrowest command (`pnpm exec tsc --noEmit`, `pnpm build`, `pnpm lint`, or the failing page in `pnpm dev`).
2. Next.js API errors: grep `node_modules/next/dist/docs/` for the API name before changing code (Next 16 differs from memory).
3. Fix the cause, never silence it (no `any`, no eslint-disable without a reason, no `dss-ignore` for real violations).
4. Re-run the command. **Stop**: cause and fix in 2 lines.
