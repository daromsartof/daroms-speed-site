import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { cx } from './cx.ts'

const HEADING_SIZES = {
  'display-2xl': 'text-display-2xl',
  'display-xl': 'text-display-xl',
  'display-lg': 'text-display-lg',
  heading: 'text-heading',
  subheading: 'text-subheading',
} as const

/**
 * @catalog Heading: display face, size from the DNA type scale. One h1 per page.
 * @props level: 1-4 (semantics); size: display-2xl | display-xl | display-lg | heading | subheading; balance (default true)
 */
export function Heading({
  level = 2,
  size,
  balance = true,
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<'h2'> & {
  level?: 1 | 2 | 3 | 4
  size?: keyof typeof HEADING_SIZES
  balance?: boolean
}) {
  const Tag = `h${level}` as ElementType
  const fallback =
    level === 1 ? 'display-xl' : level === 2 ? 'display-lg' : level === 3 ? 'heading' : 'subheading'
  return (
    <Tag
      className={cx(
        'font-display',
        HEADING_SIZES[size ?? fallback],
        balance && 'text-balance',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/**
 * @catalog Text: body copy. Muted tone keeps WCAG AA on surface and surface-2.
 * @props size: sm | base (default) | lg; tone: ink (default) | muted; as: p | span | div
 */
export function Text<T extends ElementType = 'p'>({
  as,
  size = 'base',
  tone = 'ink',
  className,
  ...rest
}: {
  as?: T
  size?: 'sm' | 'base' | 'lg'
  tone?: 'ink' | 'muted'
  className?: string
  children?: ReactNode
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>) {
  const Tag = (as ?? 'p') as ElementType
  const sizes = { sm: 'text-sm', base: 'text-base leading-relaxed', lg: 'text-body-lg' }
  return (
    <Tag
      className={cx(sizes[size], tone === 'muted' && 'text-ink-muted', 'text-pretty', className)}
      {...rest}
    />
  )
}

/**
 * @catalog Eyebrow: small label above a heading. Sentence case by default (all-caps eyebrows are a generated-site tell).
 * @props caps (opt-in uppercase with tracking)
 */
export function Eyebrow({
  caps = false,
  className,
  ...rest
}: ComponentPropsWithoutRef<'p'> & { caps?: boolean }) {
  return (
    <p
      className={cx('text-sm text-ink-muted', caps && 'tracking-[0.14em] uppercase', className)}
      {...rest}
    />
  )
}

/**
 * @catalog Prose: long-form rich text (MDX, legal pages) at reading measure.
 */
export function Prose({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cx(
        'max-w-prose text-base leading-relaxed [&_a]:text-accent-text [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-heading [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-display [&_h3]:text-subheading [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_ul]:list-disc [&_ul]:pl-6',
        className,
      )}
      {...rest}
    />
  )
}
