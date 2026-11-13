---
paths:
  - "components/**/*.tsx"
---
# Motion

> Motion follows the DNA profile (none, subtle, expressive, cinematic); animate transform/opacity only; honour reduced motion.

- CSS transitions with `duration-(--duration-brand) ease-brand` for hovers and simple states.
- `motion/react` for enter animations and gestures; CSS scroll-driven animations for scroll effects; `<ViewTransition>` for routes.
- No GSAP (license). No animation on body copy; one orchestrated entrance per page, not every element.
- Reduced motion: globals.css neutralises CSS; check `useReducedMotion()` before JS animation.
