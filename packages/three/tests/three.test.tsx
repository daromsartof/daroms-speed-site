// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { canRunScene } from '../src/support.ts'
import { Scene } from '../src/scene.tsx'

const media = (reduce: boolean) =>
  vi.fn(
    (query: string) =>
      ({ matches: reduce && query.includes('reduce'), media: query }) as unknown as MediaQueryList,
  )

describe('@dss/three', () => {
  it('refuses to run with reduced motion, DNA three none, or without WebGL', () => {
    window.matchMedia = media(true)
    expect(canRunScene()).toBe(false)
    window.matchMedia = media(false)
    document.documentElement.dataset.three = 'none'
    expect(canRunScene()).toBe(false)
    document.documentElement.dataset.three = 'hero'
    expect(canRunScene()).toBe(false) // jsdom has no WebGL
  })

  it('renders the poster and never loads the scene when it cannot run', () => {
    window.matchMedia = media(true)
    const load = vi.fn()
    const { getByRole, getByText } = render(
      <Scene load={load} poster={<p>poster</p>} label="Flowing color field" />,
    )
    expect(getByRole('img').getAttribute('aria-label')).toBe('Flowing color field')
    expect(getByText('poster')).toBeTruthy()
    expect(load).not.toHaveBeenCalled()
  })
})
