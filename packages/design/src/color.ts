// sRGB <-> OKLCH conversions without dependencies. OKLCH keeps the hue stable while
// lightness changes, which makes it the right space to derive palettes.
// Ported from daroms-speed-app packages/theme/src/color.ts.

export type Rgb = readonly [number, number, number]
export type Oklch = { l: number; c: number; h: number }

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

export function isHex(value: string): boolean {
  return HEX.test(value)
}

export function hexToRgb(hex: string): Rgb {
  const match = HEX.exec(hex.trim())
  if (!match?.[1]) throw new Error(`Invalid hex color: ${hex}`)
  const digits =
    match[1].length === 3
      ? match[1]
          .split('')
          .map((d) => d + d)
          .join('')
      : match[1]
  return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16) / 255) as unknown as Rgb
}

export function rgbToHex([r, g, b]: Rgb): string {
  const to = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const toGamma = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055)

export function rgbToOklch(rgb: Rgb): Oklch {
  const [r, g, b] = rgb.map(toLinear) as unknown as Rgb
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const c = Math.sqrt(A * A + B * B)
  const h = c < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360
  return { l: L, c, h }
}

export function oklchToRgbUnclamped({ l: L, c, h }: Oklch): Rgb {
  const rad = (h * Math.PI) / 180
  const A = c * Math.cos(rad)
  const B = c * Math.sin(rad)
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  return [toGamma(r), toGamma(g), toGamma(b)]
}

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4)

/** Reduces chroma until the color fits the sRGB gamut (hue and lightness kept). */
export function gamutMap(color: Oklch): Oklch {
  if (inGamut(oklchToRgbUnclamped(color))) return color
  let low = 0
  let high = color.c
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2
    if (inGamut(oklchToRgbUnclamped({ ...color, c: mid }))) low = mid
    else high = mid
  }
  return { ...color, c: low }
}

/** OKLCH -> hex, gamut-mapped. */
export function oklchToHex(color: Oklch): string {
  return rgbToHex(oklchToRgbUnclamped(gamutMap(color)))
}

/** CSS `oklch()` string, gamut-mapped, rounded for stable diffs. */
export function oklchCss(color: Oklch): string {
  const { l, c, h } = gamutMap(color)
  const r = (v: number, d: number) => Number(v.toFixed(d))
  return `oklch(${r(l, 3)} ${r(c, 3)} ${r(h, 1)})`
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(toLinear) as unknown as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two hex colors (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** WCAG contrast between two OKLCH colors (after gamut mapping). */
export function contrastOklch(a: Oklch, b: Oklch): number {
  return contrastRatio(oklchToHex(a), oklchToHex(b))
}
