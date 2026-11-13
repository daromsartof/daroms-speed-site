import Image, { type ImageProps } from 'next/image'
import { cx } from './cx.ts'

const RATIOS = {
  square: 'aspect-square',
  landscape: 'aspect-[4/3]',
  wide: 'aspect-[16/9]',
  portrait: 'aspect-[3/4]',
  tall: 'aspect-[2/3]',
} as const

/**
 * @catalog Media: next/image in a ratio box with DNA corners. Always pass a real `alt` and `sizes`.
 * @props src, alt, ratio: square | landscape | wide | portrait | tall, sizes, priority (LCP image only)
 */
export function Media({
  ratio = 'landscape',
  className,
  sizes = '(min-width: 768px) 50vw, 100vw',
  alt,
  ...rest
}: Omit<ImageProps, 'fill'> & { ratio?: keyof typeof RATIOS }) {
  return (
    <div
      className={cx(
        'relative overflow-hidden rounded-media bg-surface-3',
        RATIOS[ratio],
        className,
      )}
    >
      <Image fill sizes={sizes} alt={alt} className="object-cover" {...rest} />
    </div>
  )
}
