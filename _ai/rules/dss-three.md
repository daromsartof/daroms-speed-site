---
paths:
  - "components/3d/**"
---
# three.js scenes

> three/@react-three only in components/3d, client-only, lazy, rendered through <Scene> with a poster fallback; never the LCP.

- Respect `design.dna.ts` three level (none, accent, hero, immersive); `data-three` is on <html>.
- Performance: DPR clamp, `frameloop="demand"` when idle, pause offscreen, compressed GLB (Draco/Meshopt), no 4K textures.
- prefers-reduced-motion: render the poster or a still frame.
- Shaders: keep uniforms few; animate in useFrame with delta; dispose geometries and materials on unmount.
