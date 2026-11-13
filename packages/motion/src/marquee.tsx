import type { ReactNode } from 'react'

/**
 * @catalog Marquee: infinite horizontal loop in CSS (pauses on hover, static when motion is off). Logos, kinetic words.
 * @props children (one sequence; it is duplicated), label (accessible name), className
 */
export function Marquee({
  children,
  label,
  className,
}: {
  children: ReactNode
  label: string
  className?: string
}) {
  return (
    <div
      className={['overflow-hidden', className].filter(Boolean).join(' ')}
      role="region"
      aria-label={label}
    >
      <div className="marquee gap-12">
        <div className="flex shrink-0 items-center gap-12">{children}</div>
        <div className="flex shrink-0 items-center gap-12" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}
