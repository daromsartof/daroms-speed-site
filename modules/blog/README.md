# blog: Markdown articles

> /blog index, /blog/<slug> article pages (prerendered), RSS at /blog/rss.xml, posts in the sitemap and llms.txt.

- Write articles in `content/blog/<slug>.md` with front matter `title`, `description`, `date` (YYYY-MM-DD), `author`,
  optional `image`. Slug = file name. Index copy in `content/blog.ts`.
- Each article answers one real query (site.spec.md > SEO targets): answer first, then specifics; H2s as questions.
- Rendering: react-markdown + remark-gfm inside Prose (no raw HTML). Images: put files in public/ and reference them.
