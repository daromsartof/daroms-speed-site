// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Marquee, SplitWords } from '../src/index.ts'

describe('@dss/motion', () => {
  it('splits words with stagger indexes and keeps an accessible label', () => {
    const { container } = render(<SplitWords as="h1" text="Built to outlast" />)
    const h1 = container.querySelector('h1')
    expect(h1?.getAttribute('aria-label')).toBe('Built to outlast')
    const spans = [...(h1?.querySelectorAll('span') ?? [])]
    expect(spans.map((s) => s.textContent)).toEqual(['Built', 'to', 'outlast'])
    expect(spans[2]?.getAttribute('style')).toContain('--i: 2')
  })

  it('duplicates marquee content for the loop and hides the copy from assistive tech', () => {
    const { container } = render(<Marquee label="Clients">A B</Marquee>)
    const groups = container.querySelectorAll('.marquee > div')
    expect(groups).toHaveLength(2)
    expect(groups[1]?.getAttribute('aria-hidden')).toBe('true')
  })

  it('guards every animation behind reduced motion and the DNA profile', () => {
    const css = readFileSync(join(import.meta.dirname, '../src/motion.css'), 'utf8')
    expect(css).toContain('@media (prefers-reduced-motion: no-preference)')
    expect(css).toContain("html:not([data-motion='none'])")
    expect(css).toContain('@supports (animation-timeline: view())')
  })
})
