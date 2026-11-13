import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { cx } from './cx.ts'

type Polymorphic<T extends ElementType> = {
  as?: T
  className?: string
  children?: ReactNode
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>

/**
 * @catalog Container: centered column with the DNA gutter.
 * @props size: content (default, DNA width) | prose (reading measure) | full; as
 */
export function Container<T extends ElementType = 'div'>({
  as,
  size = 'content',
  className,
  ...rest
}: Polymorphic<T> & { size?: 'content' | 'prose' | 'full' }) {
  const Tag = (as ?? 'div') as ElementType
  const width = size === 'prose' ? 'max-w-prose' : size === 'full' ? 'max-w-none' : 'max-w-content'
  return <Tag className={cx('mx-auto w-full px-gutter', width, className)} {...rest} />
}

const TONES = {
  surface: 'bg-surface text-ink',
  raised: 'bg-surface-2 text-ink',
  inverse: 'bg-ink text-surface',
  accent: 'bg-accent text-accent-ink',
} as const

/**
 * @catalog Section: vertical rhythm block. Space comes from DNA density; tone swaps the palette.
 * @props tone: surface | raised | inverse | accent; space: section (default) | tight | none; rule (top rule); id
 */
export function Section({
  tone = 'surface',
  space = 'section',
  rule = false,
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<'section'> & {
  tone?: keyof typeof TONES
  space?: 'section' | 'tight' | 'none'
  rule?: boolean
}) {
  const padding = space === 'section' ? 'py-section' : space === 'tight' ? 'py-12 md:py-16' : ''
  return (
    <section className={cx(TONES[tone], padding, rule && 'rule-t', className)} {...rest}>
      {children}
    </section>
  )
}

/**
 * @catalog Stack: vertical flow with consistent gaps.
 * @props gap: xs | sm | md (default) | lg | xl; as
 */
export function Stack<T extends ElementType = 'div'>({
  as,
  gap = 'md',
  className,
  ...rest
}: Polymorphic<T> & { gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  const Tag = (as ?? 'div') as ElementType
  const gaps = { xs: 'gap-2', sm: 'gap-4', md: 'gap-6', lg: 'gap-10', xl: 'gap-16' }
  return <Tag className={cx('flex flex-col', gaps[gap], className)} {...rest} />
}

/**
 * @catalog Cluster: wrapping row (actions, tags, logos).
 * @props gap: sm | md (default) | lg; align: start | center | between
 */
export function Cluster({
  gap = 'md',
  align = 'start',
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'> & {
  gap?: 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'between'
}) {
  const gaps = { sm: 'gap-2', md: 'gap-4', lg: 'gap-8' }
  const aligns = { start: 'justify-start', center: 'justify-center', between: 'justify-between' }
  return (
    <div
      className={cx('flex flex-wrap items-center', gaps[gap], aligns[align], className)}
      {...rest}
    />
  )
}

/**
 * @catalog Grid: responsive columns. Prefer asymmetric spans (md:col-span-*) for editorial layouts.
 * @props cols: 1 | 2 | 3 | 4 | 12; gap: md (default) | lg
 */
export function Grid({
  cols = 3,
  gap = 'md',
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'> & { cols?: 1 | 2 | 3 | 4 | 12; gap?: 'md' | 'lg' }) {
  const columns = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    12: 'grid-cols-4 md:grid-cols-12',
  }
  return (
    <div
      className={cx('grid', columns[cols], gap === 'lg' ? 'gap-10' : 'gap-6', className)}
      {...rest}
    />
  )
}
