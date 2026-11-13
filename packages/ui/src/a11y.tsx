import type { ComponentPropsWithoutRef } from 'react'
import { cx } from './cx.ts'

/** @catalog SkipLink: first focusable element of the layout, jumps to #main. @props label */
export function SkipLink({ label, target = '#main' }: { label: string; target?: string }) {
  return (
    <a
      href={target}
      className="sr-only z-50 rounded-control bg-accent px-4 py-2 text-accent-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
    >
      {label}
    </a>
  )
}

/** @catalog VisuallyHidden: text for screen readers only. */
export function VisuallyHidden({ className, ...rest }: ComponentPropsWithoutRef<'span'>) {
  return <span className={cx('sr-only', className)} {...rest} />
}
