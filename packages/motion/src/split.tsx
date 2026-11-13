import type { ElementType, ReactNode } from 'react'

/**
 * @catalog SplitWords: headline revealed word by word in CSS (server-rendered, no JS). Use once per page, on the hero.
 * @props text, as (h1 | h2 | p...), className
 */
export function SplitWords({
  text,
  as,
  className,
}: {
  text: string
  as?: ElementType
  className?: string
}): ReactNode {
  const Tag = (as ?? 'span') as ElementType
  const words = text.split(/(\s+)/)
  let index = 0
  return (
    <Tag className={['split-words', className].filter(Boolean).join(' ')} aria-label={text}>
      {words.map((word, i) =>
        /^\s+$/.test(word) ? (
          word
        ) : (
          // CSS custom property for the stagger index: the one sanctioned inline style.
          <span key={i} aria-hidden style={{ '--i': index++ } as React.CSSProperties}>
            {word}
          </span>
        ),
      )}
    </Tag>
  )
}
