// @ts-check
import starlight from '@astrojs/starlight'
import { defineConfig, passthroughImageService } from 'astro/config'

const repo = 'https://github.com/daromsartof/daroms-speed-site'

// Pages come from ../docs (scripts/sync-docs.mjs): edit the Markdown there, never in src/content/docs.
export default defineConfig({
  site: 'https://daromsartof.github.io',
  base: '/daroms-speed-site',
  trailingSlash: 'always',
  image: { service: passthroughImageService() },
  integrations: [
    starlight({
      title: 'daroms-speed-site',
      description:
        'Next.js website framework built for Claude Code: varied, production-grade sites from a brief, at low token cost.',
      social: [
        { icon: 'github', label: 'GitHub', href: repo },
        {
          icon: 'npm',
          label: 'npm',
          href: 'https://www.npmjs.com/package/@daromsart/daroms-speed-site',
        },
      ],
      editLink: { baseUrl: `${repo}/edit/main/docs/` },
      lastUpdated: false,
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'alternate',
            type: 'text/plain',
            title: 'llms.txt',
            href: '/daroms-speed-site/llms.txt',
          },
        },
      ],
      sidebar: [
        {
          label: 'Start',
          items: [
            { label: 'Overview', slug: 'index' },
            { label: 'Getting started', slug: 'getting-started' },
            { label: 'Demo', slug: 'demo' },
            { label: 'For AI agents', slug: 'agents' },
          ],
        },
        {
          label: 'Concepts',
          items: [
            { label: 'Architecture', slug: 'architecture' },
            { label: 'Design DNA', slug: 'design-dna' },
            { label: 'AI layer', slug: 'ai-layer' },
          ],
        },
        {
          label: 'Features',
          items: [
            { label: 'Modules and data', slug: 'modules' },
            { label: 'Deploy, security and SEO', slug: 'deploy' },
            { label: 'Visual edits with AimKit', slug: 'aimkit' },
            { label: 'Factory', slug: 'factory' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'CLI', slug: 'cli' },
            { label: 'Catalog', slug: 'catalog' },
            { label: 'llms.txt', link: 'https://daromsartof.github.io/daroms-speed-site/llms.txt' },
            {
              label: 'llms-full.txt',
              link: 'https://daromsartof.github.io/daroms-speed-site/llms-full.txt',
            },
          ],
        },
      ],
    }),
  ],
})
