# Vendored third-party skills (frozen)

Copied as Markdown and licenses only (no scripts, images or binaries) and loaded **name-only** through `skillOverrides`
in `_ai/settings.json`, so their descriptions cost nothing on every turn. `dss-design-system` and `dss-vendor-bridge`
translate their advice into dss terms (DNA tokens, @dss/ui, registry sections, dss commands).

| Skill | Source | Commit | License | Frozen | Changes |
|---|---|---|---|---|---|
| frontend-design | https://github.com/anthropics/skills (skills/frontend-design) | 2c5958e | Apache 2.0 (LICENSE.txt) | 2026-11-13 | none |
| vercel-react-best-practices | https://github.com/vercel-labs/agent-skills (skills/react-best-practices) | 1a2c79d | MIT (README, frontmatter) | 2026-11-13 | none |
| vercel-composition-patterns | https://github.com/vercel-labs/agent-skills (skills/composition-patterns) | 1a2c79d | MIT (README) | 2026-11-13 | none |
| vercel-react-view-transitions | https://github.com/vercel-labs/agent-skills (skills/react-view-transitions) | 1a2c79d | MIT (README, frontmatter) | 2026-11-13 | none |
| web-design-guidelines | https://github.com/vercel-labs/agent-skills (skills/web-design-guidelines) + https://github.com/vercel-labs/web-interface-guidelines (command.md) | 1a2c79d / 434b7f9 | MIT | 2026-11-13 | reads the local `guidelines.md` snapshot instead of fetching it |
| wq-core-web-vitals | https://github.com/addyosmani/web-quality-skills (skills/core-web-vitals) | afa8da9 | MIT | 2026-11-13 | `wq-` prefix (avoids name clashes) |
| wq-performance | https://github.com/addyosmani/web-quality-skills (skills/performance) | afa8da9 | MIT | 2026-11-13 | `wq-` prefix |
| ecc-tdd-workflow | https://github.com/affaan-m/ECC (skills/tdd-workflow) | b38be6a | MIT | 2026-11-03 | `ecc-` prefix (via daroms-speed-app) |
| ecc-security-review | https://github.com/affaan-m/ECC (skills/security-review) | b38be6a | MIT | 2026-11-03 | `ecc-` prefix (via daroms-speed-app) |
| ecc-accessibility | https://github.com/affaan-m/ECC (skills/accessibility) | b38be6a | MIT | 2026-11-03 | `ecc-` prefix (via daroms-speed-app) |
| ecc-typescript-patterns | https://github.com/affaan-m/ECC (skills/typescript-patterns) | b38be6a | MIT | 2026-11-03 | `ecc-` prefix (via daroms-speed-app) |

Not vendored, install per user after review if wanted:
- `design-taste-frontend` (leonxlnx/taste-skill, MIT): depends on its scripts and assets (browser checker), which a
  Markdown-only copy would break: `npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend`.
- `ui-ux-pro-max` (nextlevelbuilder/ui-ux-pro-max-skill, MIT): thousands of lines of Python and CSV data.
- `webapp-testing` (anthropics/skills): its value is in Python helper scripts.

Update: clone the source, copy the Markdown and licenses again, update this table, run `pnpm check`, release the core.
