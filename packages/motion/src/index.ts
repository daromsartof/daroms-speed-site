// Server-rendered motion helpers. Classes: reveal, reveal-fade, reveal-scale, reveal-stagger (children get --i),
// parallax, marquee, split-words (motion.css). Client: @dss/motion/count-up.
export { SplitWords } from './split.tsx'
export { Marquee } from './marquee.tsx'

/** Style object carrying a stagger index for `.reveal-stagger` children: `style={stagger(i)}`. */
export const stagger = (index: number) => ({ '--i': index }) as Record<string, number>
