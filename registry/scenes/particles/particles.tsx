// dss-scene: particles@0.1.0
'use client'
import { Scene } from '@dss/three'

const load = () => import('./particles-content')

/** @catalog ParticlesScene: drifting point field in the DNA accent, reacts gently to the pointer. @props label, className */
export function ParticlesScene({ label, className }: { label: string; className?: string }) {
  return (
    <Scene
      load={load}
      label={label}
      className={className}
      poster={<div className="h-full w-full bg-surface-2 texture-halftone" />}
    />
  )
}
