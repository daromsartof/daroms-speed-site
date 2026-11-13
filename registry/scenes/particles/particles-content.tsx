'use client'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, SRGBColorSpace, type Points } from 'three'
import { tokenColor } from '@dss/three'

const COUNT = 1400

/** Seeded generator: the same cloud on every render and every visit (render stays pure). */
function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Points on a thick sphere shell, computed once when the module loads. */
const POSITIONS = (() => {
  const random = seeded(7)
  const array = new Float32Array(COUNT * 3)
  for (let i = 0; i < COUNT; i++) {
    const radius = 1.5 + random() * 2.5
    const theta = random() * Math.PI * 2
    const phi = Math.acos(2 * random() - 1)
    array[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    array[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    array[i * 3 + 2] = radius * Math.cos(phi)
  }
  return array
})()

/** A slowly rotating cloud of points in the DNA accent, tilting with the pointer. */
export default function ParticlesContent() {
  const points = useRef<Points>(null)
  const color = useMemo(() => new Color().setRGB(...tokenColor('accent'), SRGBColorSpace), [])
  useFrame((state, delta) => {
    const cloud = points.current
    if (!cloud) return
    cloud.rotation.y += delta * 0.04
    cloud.rotation.x += (state.pointer.y * 0.15 - cloud.rotation.x) * 0.05
  })
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[POSITIONS, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color={color}
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
