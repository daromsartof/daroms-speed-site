import type { Route } from 'next'
import Link from 'next/link'
import type { ComponentPropsWithoutRef } from 'react'
import { cx } from './cx.ts'

const VARIANTS = {
  primary: 'bg-accent text-accent-ink hover:-translate-y-0.5',
  secondary: 'border border-line text-ink hover:bg-surface-2',
  inverse: 'bg-surface text-ink hover:-translate-y-0.5',
  ghost: 'text-ink hover:bg-surface-2',
  link: 'px-0! py-0! text-accent-text underline underline-offset-4 hover:no-underline',
} as const
const SIZES = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3', lg: 'px-8 py-4 text-body-lg' } as const

export type ButtonVariant = keyof typeof VARIANTS
export type ButtonSize = keyof typeof SIZES

const base =
  'inline-flex items-center justify-center gap-2 rounded-control font-medium transition duration-(--duration-brand) ease-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50'

export const buttonClass = (
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
) => cx(base, SIZES[size], VARIANTS[variant], className)

/**
 * @catalog Button: native button (forms, toggles). For navigation use ButtonLink.
 * @props variant: primary | secondary | inverse | ghost | link; size: sm | md | lg
 */
export function Button({
  variant,
  size,
  className,
  type = 'button',
  ...rest
}: ComponentPropsWithoutRef<'button'> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />
}

/**
 * @catalog ButtonLink: next/link styled as a button. External URLs open safely in a new tab.
 * @props href (typed Route or https URL), variant, size
 */
export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
  ...rest
}: Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  href: Route | `https://${string}` | `mailto:${string}` | `tel:${string}`
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  const classes = buttonClass(variant, size, className)
  if (/^(https:|mailto:|tel:)/.test(href)) {
    const external = href.startsWith('https:')
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    )
  }
  return (
    <Link href={href as Route} className={classes} {...rest}>
      {children}
    </Link>
  )
}
