'use client'
import type { Canvas as FiberCanvas } from '@react-three/fiber'
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { canRunScene } from './support.ts'

type CanvasType = typeof FiberCanvas
type Loaded = { Canvas: CanvasType; Content: ComponentType }

export type SceneProps = {
  /** Lazy scene content (R3F elements): `() => import('./gradient-content')`. */
  load: () => Promise<{ default: ComponentType }>
  /** Server-rendered fallback shown until the canvas is ready, and forever when the scene cannot run. */
  poster: ReactNode
  /** Accessible description of what the scene shows. */
  label: string
  className?: string
  /** Device pixel ratio clamp. */
  dpr?: [number, number]
}

/**
 * @catalog Scene (client): lazy three.js canvas with poster fallback; never the LCP element. Use inside components/3d only.
 * @props load, poster, label, className, dpr
 */
export function Scene({ load, poster, label, className, dpr = [1, 1.75] }: SceneProps) {
  const host = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [onScreen, setOnScreen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const node = host.current
    if (!node || !canRunScene()) return
    let cancelled = false
    let requested = false
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(entry?.isIntersecting)
        setOnScreen(visible)
        if (visible && !requested) {
          requested = true
          void Promise.all([import('@react-three/fiber'), load()]).then(([fiber, mod]) => {
            if (!cancelled) setLoaded({ Canvas: fiber.Canvas, Content: mod.default })
          })
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(node)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [load])

  const Canvas = loaded?.Canvas
  const Content = loaded?.Content
  return (
    <div
      ref={host}
      className={['relative overflow-hidden', className].filter(Boolean).join(' ')}
      role="img"
      aria-label={label}
    >
      <div
        aria-hidden
        className={`absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}
      >
        {poster}
      </div>
      {Canvas && Content && (
        <Canvas
          className="absolute! inset-0"
          dpr={dpr}
          frameloop={onScreen ? 'always' : 'never'}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          onCreated={() => setReady(true)}
        >
          <Content />
        </Canvas>
      )}
    </div>
  )
}
