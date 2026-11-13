# Factory: brain, sites, batch, upgrades

> What makes dss a production line: a memory shared by all sites, a registry, batch creation, upgrades and releases.

## Factory brain

`~/.dss/brain` is a Markdown wiki the agent maintains (Karpathy's LLM wiki pattern, gbrain-style pages): `index.md`
read first, `log.md` append-only, `raw/` immutable sources, `wiki/` pages for industries, patterns, voice, fixes,
stacks and sites, and `dna-history.jsonl` for anti-repetition.

```bash
pnpm dss brain init
pnpm dss brain query "family restaurant in Lyon"
pnpm dss brain status
```

`/dss-research` queries it before design; `/dss-brain-ingest` compiles a finished site's lessons (no client personal
data); `/dss-brain-lint` keeps it consistent; the prompt router adds a one-line hint when a page matches.

## Sites and batches

`pnpm dss sites` lists every site created on the machine with its last deployment (`~/.dss/sites.json`).

```bash
pnpm dss factory run ./briefs --out ./sites            # one site per brief
pnpm dss factory run ./briefs --out ./sites --agent    # plus /dss-site --auto in headless Claude Code
```

A brief is Markdown with front matter (`slug`, `name`, `preset`, `industry`, `mood`, `url`, `modules`); the body
becomes `site.spec.md`. Results and costs go to `factory.log.jsonl`.

## Upgrades and releases

- In a site: `pnpm dss upgrade` moves `core/` to the latest tag, aligns Next, OpenNext, wrangler and other template
  versions, re-syncs the AI layer, regenerates the theme and runs doctor.
- In the framework: `pnpm dss release-core minor` bumps every version, writes the changelog section, commits and tags;
  pushing the tag publishes to npm.
