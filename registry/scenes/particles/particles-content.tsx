'use client'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, SRGBColorSpace, type Points } from 'three'
import { tokenColor } from '@dss/three'

const COUNT = 1400

/** A slowly rotating cloud of points; positions are generated once on the client. */
export default function ParticlesContent() {
  const points = useRef<Points>(null)
  const positions = useMemo(() => {
    const array = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const radius = 1.5 + Math.random() * 2.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      array[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      array[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      array[i * 3 + 2] = radius * Math.cos(phi)
    }
    return array
  }, [])
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
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
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
