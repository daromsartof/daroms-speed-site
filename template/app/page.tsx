import { Hero } from '@/components/sections/hero'
import { home } from '@/content/home'

export default function HomePage() {
  return (
    <main>
      <Hero {...home.hero} />
    </main>
  )
}
