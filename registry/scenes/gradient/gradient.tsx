// dss-scene: gradient@0.1.0
'use client'
import { Scene } from '@dss/three'

const load = () => import('./gradient-content')

/** @catalog GradientScene: slow flowing shader field in the DNA accent, secondary and surface colors. @props label, className */
export function GradientScene({ label, className }: { label: string; className?: string }) {
  return (
    <Scene
      load={load}
      label={label}
      className={className}
      poster={<div className="h-full w-full bg-surface-2 texture-mesh" />}
    />
  )
}
