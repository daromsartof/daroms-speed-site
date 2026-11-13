'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * @catalog CountUp (client): animates a number from 0 when it enters the viewport; renders the final value without JS
 * or with reduced motion. Keep the label outside.
 * @props value (number), prefix?, suffix?, duration? (ms)
 */
export function CountUp({
  value,
  prefix = '',
  suffix = '',
  duration = 1200,
}: {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(value)
  useEffect(() => {
    const node = ref.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!node || reduced || document.documentElement.dataset.motion === 'none') return
    setShown(0)
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        setShown(Math.round(value * (1 - (1 - t) ** 3)))
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    })
    observer.observe(node)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value, duration])
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {shown.toLocaleString()}
      {suffix}
    </span>
  )
}
