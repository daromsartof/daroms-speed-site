/**
 * Resolves a CSS color (including oklch() DNA tokens) to sRGB components in [0, 1] through a 1x1 canvas,
 * so shaders and materials use the exact theme colors. Call in the browser only.
 */
export function cssColor(value: string): [number, number, number] {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return [0.5, 0.5, 0.5]
  ctx.fillStyle = value
  ctx.fillRect(0, 0, 1, 1)
  const [r = 128, g = 128, b = 128] = ctx.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}

/** A DNA token (`accent`, `secondary`, `surface`...) as sRGB components, read from :root. */
export function tokenColor(token: string): [number, number, number] {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${token}`)
    .trim()
  return cssColor(value || 'gray')
}
