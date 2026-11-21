import { describe, expect, it } from 'vitest'
import {
  failing,
  offPalette,
  scoreMeasures,
  themeRef,
  type Action,
  type RawMeasures,
} from '../lib/taste.ts'

const THEME_CSS = `@theme {
  --color-surface: oklch(0.97 0.012 85);
  --color-ink: oklch(0.2 0.02 85);
  --color-accent: oklch(0.55 0.15 35);
  --color-secondary: oklch(0.6 0.09 160);

  --font-display: var(--font-face-display), serif;
  --font-body: var(--font-face-body), sans-serif;
  --font-mono: ui-monospace, monospace;

  --text-display-2xl: clamp(3rem, 8vw, 7rem);
  --text-display-2xl--line-height: 0.98;
  --text-heading: clamp(1.5rem, 2.5vw, 2rem);
  --text-body-lg: 1.125rem;

  --radius-card: 1rem;
  --radius-control: 999px;
  --radius-media: 1.25rem;
}`

const empty: RawMeasures = {
  colors: [],
  radii: [],
  fontSizes: [],
  fontFamilies: ['Fraunces', 'Inter'],
  gradients: [],
  emoji: [],
  actions: [],
}
const link = (label: string, href: string, x = 0, y = 0, w = 120, h = 44): Action => ({
  label,
  href,
  x,
  y,
  w,
  h,
  inline: false,
  main: true,
})

describe('taste measures', () => {
  const theme = themeRef(THEME_CSS)
  const metric = (raw: RawMeasures, key: string) =>
    scoreMeasures(raw, theme).find((m) => m.key === key)!

  it('reads the DNA scale from theme.css', () => {
    expect(theme.hues).toEqual([35, 160])
    expect(theme.radii).toEqual([16, 20])
    expect(theme.sizes).toBe(3 + 3)
    expect(theme.families).toBe(3)
  })

  it('flags vivid hues that match no token, ignores neutrals and faint tints', () => {
    const colors = [
      { css: 'rgba(196, 84, 52, 1.00)', count: 4, sample: 'Book a visit' },
      { css: 'rgba(99, 102, 241, 1.00)', count: 2, sample: 'Badge' },
      { css: 'rgba(245, 243, 238, 1.00)', count: 30, sample: 'body' },
      { css: 'rgba(99, 102, 241, 0.10)', count: 3, sample: 'tint' },
    ]
    const off = offPalette(colors, theme.hues)
    expect(off).toHaveLength(1)
    expect(off[0]!.sample).toBe('Badge')
  })

  it('flags radii off the DNA scale', () => {
    const radii = [
      { px: 16, sample: 'Card' },
      { px: 6, sample: 'Get a quote' },
    ]
    expect(metric({ ...empty, radii }, 'radii').detail).toEqual(['6px: Get a quote'])
  })

  it('counts one destination with several labels and vague repeated labels', () => {
    const actions = [
      { ...link('Contact', '/contact'), main: false },
      link('Get in touch', '/contact'),
      link('Book a visit', '/contact'),
      link('Learn more', '/services'),
      link('Learn more', '/about'),
      link('Home', '/'),
    ]
    expect(metric({ ...empty, actions }, 'labelsPerTarget').value).toBe(1)
    expect(metric({ ...empty, actions }, 'targetsPerLabel').value).toBe(1)
  })

  it('flags crowded small targets, spares spaced ones and inline text links', () => {
    const actions = [
      { ...link('terms', '/legal', 0, 0, 40, 18), inline: true },
      link('Services', '/services', 0, 100, 60, 20),
      link('About', '/about', 120, 100, 50, 20),
      link('', 'https://instagram.com/x', 0, 300, 20, 20),
      link('LinkedIn', 'https://linkedin.com/x', 22, 300, 20, 20),
    ]
    expect(metric({ ...empty, actions }, 'targets').value).toBe(2)
    expect(metric({ ...empty, actions }, 'unnamed').value).toBe(1)
  })

  it('passes a sober page and fails on emoji, stray gradients and extra fonts', () => {
    expect(failing(scoreMeasures(empty, theme))).toEqual([])
    const raw = {
      ...empty,
      fontFamilies: ['Fraunces', 'Inter', 'ui-monospace', 'Arial'],
      emoji: [`Hello ${String.fromCodePoint(0x1f44b)}`],
      gradients: ['Hero'],
    }
    expect(
      failing(scoreMeasures(raw, theme))
        .map((m) => m.key)
        .sort(),
    ).toEqual(['emoji', 'families', 'gradients'])
  })
})
