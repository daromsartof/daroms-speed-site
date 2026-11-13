'use client'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Vector3, type ShaderMaterial } from 'three'
import { tokenColor } from '@dss/three'

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const fragmentShader = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec3 uAccent;
uniform vec3 uSecondary;
uniform vec3 uSurface;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}
void main() {
  vec2 p = vUv * 2.5;
  float t = uTime;
  float n = fbm(p + vec2(t, -t * 0.7) + fbm(p * 1.5 - t));
  vec3 color = mix(uSurface, uAccent, smoothstep(0.3, 0.8, n));
  color = mix(color, uSecondary, smoothstep(0.6, 0.95, fbm(p * 0.8 + t * 1.3)) * 0.6);
  gl_FragColor = vec4(color, 1.0);
}
`

/** Full-canvas plane; colors are read once from the DNA tokens on :root. */
export default function GradientContent() {
  const material = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAccent: { value: new Vector3(...tokenColor('accent')) },
      uSecondary: { value: new Vector3(...tokenColor('secondary')) },
      uSurface: { value: new Vector3(...tokenColor('surface-2')) },
    }),
    [],
  )
  useFrame((_, delta) => {
    const time = material.current?.uniforms.uTime
    if (time) time.value += delta * 0.08
  })
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  )
}
