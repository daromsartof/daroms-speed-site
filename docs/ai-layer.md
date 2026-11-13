# AI layer

> How dss keeps Claude Code fast and cheap: small always-on context, rules by path, forked workers, guard hooks, a router and a shared brain.

## Context loading

- `CLAUDE.md` imports `AGENTS.md` (Next.js), the kernel `core/_ai/CLAUDE.core.md` (under 60 lines) and the generated digest
  (one line per rule).
- Rules in `.claude/rules/` load only for the files being touched (`paths:` front matter); on-demand rules are read when
  the topic comes up.
- `core/CATALOG.md` replaces reading core sources: tokens, primitives, sections, scenes, modules, archetypes, font
  pairs, package APIs.

## Skills and agents

`/dss-site` orchestrates the whole site. Steps run as skills; mechanical ones are forked on Sonnet or Haiku and return
short summaries: `dss-brief`, `dss-new`, `dss-research`, `dss-inspire`, `dss-dna`, `dss-sitemap`, `dss-copy`,
`dss-page`, `dss-section`, `dss-seo`, `dss-check`, `dss-polish`, `dss-deploy`, `dss-edit`, `dss-fix`, `dss-learn`,
`dss-commit`, `dss-brain-query`, `dss-brain-ingest`, `dss-brain-lint`, `dss-handoff`.

Agents with strict output contracts: `dss-critic`, `dss-designer`, `dss-reviewer`, `dss-seo-auditor`, `dss-a11y`.
Eleven third-party skills (frontend-design, React best practices, web guidelines, view transitions, web quality,
ECC security, accessibility, TDD, TypeScript) are vendored and loaded name-only.

## Hooks

| Hook                   | Event                          | Job                                                                            |
| ---------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| `dss-sync.py`          | SessionStart                   | copy `core/_ai` into `.claude/`, merge settings, silent when unchanged         |
| `dss-context.py`       | SessionStart, UserPromptSubmit | index pages and sections; route prompts (French aliases) to files; brain hint  |
| `dss-check-rules.py`   | PreToolUse                     | refuse writes that break tokens, Next 16 APIs, security rules or the slop gate |
| `dss-typecheck.py`     | PostToolUse                    | tsc and eslint on the touched file, at most 20 lines back                      |
| `dss-deny-env.py`      | PreToolUse (Bash)              | never read `.env*`, `.dev.vars` or secret stores                               |
| `dss-session-stats.py` | Stop                           | tokens per session in `.claude/stats.jsonl`, context warning above 150k        |

## Measuring

`pnpm dss cost` reads Claude Code transcripts and writes `site.cost.md`: tokens and API-equivalent price per step,
model and session, cache savings and subagent share.
