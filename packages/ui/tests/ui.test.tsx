// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ButtonLink, Container, Eyebrow, Heading, Section, Text } from '../src/index.ts'

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

describe('@dss/ui', () => {
  it('maps heading levels to DNA sizes', () => {
    render(<Heading level={1}>Title</Heading>)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.className).toContain('text-display-xl')
    expect(h1.className).toContain('font-display')
  })

  it('lets size override the level default', () => {
    render(
      <Heading level={2} size="display-2xl">
        Big
      </Heading>,
    )
    expect(screen.getByRole('heading', { level: 2 }).className).toContain('text-display-2xl')
  })

  it('renders sections with tone and DNA spacing', () => {
    const { container } = render(<Section tone="inverse">x</Section>)
    expect(container.firstElementChild?.className).toMatch(/bg-ink text-surface py-section/)
  })

  it('keeps eyebrows in sentence case unless asked', () => {
    render(<Eyebrow>Label</Eyebrow>)
    expect(screen.getByText('Label').className).not.toContain('uppercase')
  })

  it('opens external links safely and internal ones through next/link', () => {
    render(
      <>
        <ButtonLink href="https://example.org">Out</ButtonLink>
        <ButtonLink href="/about">In</ButtonLink>
      </>,
    )
    expect(screen.getByText('Out').getAttribute('rel')).toBe('noopener noreferrer')
    expect(screen.getByText('In').getAttribute('target')).toBeNull()
  })

  it('supports polymorphic containers and muted text', () => {
    const { container } = render(
      <Container as="header" size="prose">
        <Text tone="muted">x</Text>
      </Container>,
    )
    expect(container.querySelector('header')?.className).toContain('max-w-prose')
    expect(container.querySelector('p')?.className).toContain('text-ink-muted')
  })
})
