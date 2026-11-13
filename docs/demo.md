# Demo: Clear to Board

> A real site built by the dss agent from one brief: an independent guide to Europe's ETIAS and EES rules, with an in-browser checker that spots fake ETIAS websites.

**Live preview: [clear-to-board.romeoerika-razaka.workers.dev](https://clear-to-board.romeoerika-razaka.workers.dev/)**
(Cloudflare Workers, noindexed like every dss preview).

![Clear to Board home page: the headline "There is nothing to apply for yet." beside the link checker flagging europa.eu.etias-apply.com as a look-alike address](https://daromsartof.github.io/daroms-speed-site/demo/clear-to-board.jpg)

## The problem it solves

ETIAS, the 20-euro travel authorisation for visa-exempt visitors to Europe, is not in operation and has no start date
(checked 13 November 2026). Meanwhile, in October 2026, the UK travel association ABTA warned alongside Frontex that
more than 150 fraudulent or misleading websites target travellers with paid "applications". The site answers the
question in one line, gives the official address, and checks any link in the browser before someone pays.

## How it was built

1. One Markdown brief with the facts and their sources (pitch, audience, offer, proof, voice, pages).
2. `pnpm dss factory run ./briefs --out ./sites --agent`: `dss new` scaffolded the site, then headless Claude Code ran
   `/dss-site --auto`: research, inspiration, Design DNA, sitemap, copy, pages, SEO, checks, polish and lessons for the
   factory brain. Each step is a commit; each decision is a line in `site.spec.md > Journal`.
3. The agent dropped the preset's services, team and testimonials (none exist), added `/etias`, `/ees` and `/scams`,
   and wrote the signature section: a hostname checker with tests for look-alikes (`europa.eu.etias-apply.com`), the
   userinfo trick (`europa.eu@evil.com`) and homoglyphs (a Cyrillic `е`).
4. Two follow-ups on request: the checker moved into the hero, and the legal pages were filled from the publisher's
   own legal notice. Then `pnpm dss deploy` for the preview.

| Agent run          |                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------ |
| Duration           | 24 minutes, 5 sessions                                                               |
| Cost at API prices | $6.38 (Opus orchestrator 49%, Sonnet workers 51%, Haiku research and brain under 1%) |
| Output             | 17 static routes, 2 journal articles, legal and privacy pages, report form           |

## Result

- Lighthouse mobile **100** for performance, accessibility, best practices and SEO on the home, `/etias`, `/scams` and
  `/contact` pages; LCP 0.8 s, CLS 0.
- Design DNA `institutional`: Source Serif with IBM Plex, a deep green accent and an oxblood secondary, chosen by the
  agent after rejecting amber (too close to the EU's gold).
- Strict CSP and security headers, no cookies, no analytics, robots and `noindex` on the preview.
- The framework improved from the run: headless permissions, `pnpm test` in sites, the first Cloudflare preview, a
  false positive in a rule hook. Each fix is in the [changelog](https://github.com/daromsartof/daroms-speed-site/blob/main/CHANGELOG.md).

## Run your own

```bash
npx @daromsart/daroms-speed-site new my-site --preset vitrine --industry "<industry>" --mood "<two or three words>"
cd my-site && pnpm dev
# in Claude Code: /dss-site <one-sentence idea>
```

Batch mode and the brief format: [Factory](factory.md). What an agent reads first: [For AI agents](agents.md).
