---
name: dss-site
description: Orchestrates a whole website from an idea to a deployed site, step by step, with a user checkpoint after each step (brief, scaffold, research, inspiration, DNA, sitemap, copy, pages, SEO, checks, polish, deploy, learn).
argument-hint: "<the business or idea, one sentence>"
disable-model-invocation: true
---

# /dss-site: a website, A to Z

Idea: $ARGUMENTS

Run the steps below. After each: a summary of at most 3 lines, then **ask for validation** (AskUserQuestion: Continue / Adjust / Stop). Never skip a checkpoint.
With `--auto` (factory runs): no checkpoints; record each decision in `site.spec.md > Journal`, stop before step 12.

| # | Step | Skill | Deliverable |
|---|---|---|---|
| 1 | Brief | `/dss-brief` | `site.spec.md` validated |
| 2 | Scaffold | `/dss-new` | site created, `pnpm dev` works |
| 3 | Research | `/dss-research` | brain learnings, competitors, keywords in the spec |
| 4 | Inspiration | `/dss-inspire` | references distilled into the spec |
| 5 | Design DNA | `/dss-dna` | DNA locked, theme generated, Design Read in the spec |
| 6 | Sitemap | `/dss-sitemap` | pages and sections in the manifest |
| 7 | Copy | `/dss-copy <page>` per page | no placeholders left except real facts to ask for |
| 8 | Pages | `/dss-page <route>` per page | bespoke hero/signature section, pages complete |
| 9 | SEO | `/dss-seo` | metadata, JSON-LD, sitemap, llms.txt checked |
| 10 | Checks | `/dss-check` | doctor, build, Lighthouse budgets green |
| 11 | Polish | `/dss-polish` | critic and designer fixes applied |
| 12 | Deploy | `/dss-deploy` | preview URL (production after approval) |
| 13 | Close | `/dss-learn`, `/dss-commit`, `pnpm dss cost` | brain updated, `site.cost.md` |

Rules of the run:
- This thread keeps the dialogue (steps 1 to 6) and the summaries. Steps 3, 7 to 11 and 13 run as forked skills on
  Sonnet or Haiku: they read `site.spec.md` and the code, not this conversation. Pass in the argument anything not written down.
- "Adjust" after a forked step: rerun the skill with the instruction as its argument; do not fix it here.
- Facts the site needs and nobody gave (prices, addresses, testimonials, photos): collect them in `site.spec.md > Open facts`
  and ask the user once, grouped, before step 12.
- Commit after each step with `/dss-commit`.
