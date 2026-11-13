import type { Metadata, Route } from 'next'
import Link from 'next/link'
import { pageMetadata } from '@dss/seo'
import { Container, Heading, Text } from '@dss/ui'
import { blog } from '@/content/blog'
import { getPosts } from '@/lib/blog'
import manifest from '@/site.manifest'

export const metadata: Metadata = pageMetadata(manifest, { ...blog.meta, path: '/blog' })

export default function BlogPage() {
  const posts = getPosts()
  return (
    <main id="main" className="py-section">
      <Container size="prose">
        <Heading level={1} size="display-lg">
          {blog.index.title}
        </Heading>
        <Text size="lg" tone="muted" className="mt-6">
          {blog.index.intro}
        </Text>
        <ol className="mt-14 rule-b">
          {posts.map((post) => (
            <li key={post.slug} className="rule-t py-8">
              <time dateTime={post.date} className="text-sm text-ink-muted">
                {post.date}
              </time>
              <Heading level={2} size="heading" className="mt-2">
                <Link href={`/blog/${post.slug}` as Route} className="hover:text-accent-text">
                  {post.title}
                </Link>
              </Heading>
              <Text tone="muted" className="mt-2">
                {post.description}
              </Text>
            </li>
          ))}
        </ol>
      </Container>
    </main>
  )
}
