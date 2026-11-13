import type { Metadata, Route } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { articleSchema, breadcrumbSchema, pageMetadata } from '@dss/seo'
import { JsonLd } from '@dss/seo/react'
import { Container, Heading, Prose } from '@dss/ui'
import { blog } from '@/content/blog'
import { getPost, getPosts } from '@/lib/blog'
import manifest from '@/site.manifest'

export const dynamicParams = false

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata(props: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const post = getPost((await props.params).slug)
  if (!post) return {}
  return pageMetadata(manifest, {
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: 'article',
    publishedTime: post.date,
    image: post.image,
  })
}

export default async function ArticlePage(props: PageProps<'/blog/[slug]'>) {
  const post = getPost((await props.params).slug)
  if (!post) notFound()
  const path = `/blog/${post.slug}`
  return (
    <main id="main" className="py-section">
      <Container size="prose">
        <Link href={'/blog' as Route} className="text-sm text-ink-muted hover:text-accent-text">
          {blog.index.back}
        </Link>
        <Heading level={1} size="display-lg" className="mt-6">
          {post.title}
        </Heading>
        <p className="mt-4 text-sm text-ink-muted">
          <time dateTime={post.date}>{post.date}</time>
          {post.author && <span> · {post.author}</span>}
        </p>
        <Prose className="mt-10">
          <Markdown remarkPlugins={[remarkGfm]}>{post.body}</Markdown>
        </Prose>
      </Container>
      <JsonLd
        nodes={[
          articleSchema(manifest, { ...post, path, published: post.date }),
          breadcrumbSchema(manifest, [
            { name: blog.index.title, path: '/blog' },
            { name: post.title, path },
          ]),
        ]}
      />
    </main>
  )
}
