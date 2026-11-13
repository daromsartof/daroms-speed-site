import Link from 'next/link'
import { site } from '@/content/site'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center gap-6 px-5">
      <h1 className="font-display text-4xl md:text-6xl">{site.notFound.title}</h1>
      <p className="text-lg text-ink-muted">{site.notFound.body}</p>
      <Link href="/" className="underline underline-offset-4">
        {site.notFound.cta}
      </Link>
    </main>
  )
}
