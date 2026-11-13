---
name: dss-new
description: Creates the site from site.spec.md - dss new with the right preset, industry and moods - then starts the dev server.
argument-hint: "<slug> [--preset vitrine|landing|blank]"
disable-model-invocation: true
---

# /dss-new: scaffold

Target: $ARGUMENTS

1. From `site.spec.md` pick: preset (`vitrine` for a business with several pages, `landing` for one offer or event,
   `blank` for a bespoke structure), industry words, 2-4 mood words from the Voice section.
2. Run `pnpm dss new <slug> --name "<Name>" --preset <preset> --industry "<words>" --mood <a,b,c> --url https://<domain>`
   from the parent folder (add `--copy` when the site is handed to a client who will not have core access).
3. Move `site.spec.md` into the new site if it was written outside; `cd` into it.
4. `pnpm dss doctor --quick`; then start `pnpm dev` in the background and confirm http://localhost:3000 answers.
5. **Stop**: the Design Read line printed by `dss new` and the dev URL.
