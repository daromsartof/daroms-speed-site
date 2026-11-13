---
name: dss-handoff
description: Prepares a site for its owner - self-contained core, client README (edit content, deploy, credentials), legal and open facts check, final doctor - so the client can run it without dss tooling access.
disable-model-invocation: true
---

# /dss-handoff: give the site to its owner

1. Preconditions: `/dss-check` green, `pnpm dss doctor --strict` passes, production URL in `site.spec.md > Launch`.
2. Core: if `core/` is a submodule pointing to a private repository, recreate the site with `--copy` or replace the
   submodule by a copy of the same commit (ask the user before rewriting git history).
3. Write `HANDOFF.md`: what the site is, where content lives (`content/*.ts`, `content/blog/*.md`), how to preview
   (`pnpm dev`) and deploy (target-specific command), which accounts and secrets exist (names only, never values),
   modules installed and what they need, how to get help.
4. Legal: legal notice and privacy pages filled and confirmed by the owner (legal module); analytics provider listed.
5. `/dss-brain-ingest <slug>`, then `/dss-commit`. **Stop**: the handoff checklist with each item done or open.
