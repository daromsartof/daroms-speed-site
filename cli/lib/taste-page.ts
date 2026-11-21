// In-page readings for the taste measures (see taste.ts for the scoring).
import type { RawMeasures } from './taste.ts'

/**
 * Readings inside the page. Self-contained: Playwright serialises it, so it captures nothing.
 * Skipped: hidden and visually hidden (sr-only) elements, media, pill radii (>= half the short side)
 * and radii on elements under 24 px. Gradients count only when colourful: DNA textures and neutral
 * scrims over images are fine.
 */
export function collectMeasures(): RawMeasures {
  const canvas = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  const rgba = (css: string): number[] | undefined => {
    if (!canvas || !css || css === 'none' || css.startsWith('url')) return undefined
    canvas.clearRect(0, 0, 1, 1)
    canvas.fillStyle = '#000'
    canvas.fillStyle = css
    canvas.fillRect(0, 0, 1, 1)
    const data = Array.from(canvas.getImageData(0, 0, 1, 1).data)
    return data[3] === 0 ? undefined : data
  }
  const normalise = (css: string) => {
    const c = rgba(css)
    return c && `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${(c[3]! / 255).toFixed(2)})`
  }
  const colourful = (image: string) =>
    (image.match(/(?:rgba?|oklab|oklch|lab|lch|hsla?|color)\([^()]*\)|#[0-9a-f]{3,8}\b/gi) ?? [])
      .map(rgba)
      .some(
        (c) =>
          !!c && c[3]! > 50 && Math.max(c[0]!, c[1]!, c[2]!) - Math.min(c[0]!, c[1]!, c[2]!) >= 40,
      )
  const concealedCache = new Map<Element, boolean>()
  const concealed = (el: Element | null): boolean => {
    if (!el || el === document.body) return false
    const cached = concealedCache.get(el)
    if (cached !== undefined) return cached
    const s = getComputedStyle(el)
    const hidden =
      s.visibility === 'hidden' ||
      Number(s.opacity) === 0 ||
      s.clipPath.startsWith('inset(50%') ||
      /rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)/.test(s.clip) ||
      concealed(el.parentElement)
    concealedCache.set(el, hidden)
    return hidden
  }
  const label = (el: Element) =>
    (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
  const colors = new Map<string, { css: string; count: number; sample: string }>()
  const addColor = (raw: string, el: Element) => {
    const css = normalise(raw)
    if (!css) return
    const entry = colors.get(css) ?? {
      css,
      count: 0,
      sample: label(el) || el.tagName.toLowerCase(),
    }
    entry.count += 1
    colors.set(css, entry)
  }
  const radii: { px: number; sample: string }[] = []
  const fontSizes: { px: number; sample: string }[] = []
  const families = new Set<string>()
  const gradients: string[] = []
  const emoji: string[] = []
  const pictograph = /\p{Extended_Pictographic}/u
  for (const el of Array.from(document.body.querySelectorAll('*'))) {
    if (el.closest('img, video, canvas, picture, iframe')) continue
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0 || concealed(el)) continue
    const style = getComputedStyle(el)
    addColor(style.backgroundColor, el)
    if (parseFloat(style.borderTopWidth) > 0) addColor(style.borderTopColor, el)
    if (el instanceof SVGElement) {
      addColor(style.stroke, el)
      addColor(style.fill, el)
    }
    const textured = typeof el.className === 'string' && el.className.includes('texture-')
    if (!textured && style.backgroundImage.includes('gradient') && colourful(style.backgroundImage))
      gradients.push(label(el) || el.tagName.toLowerCase())
    const side = Math.min(rect.width, rect.height)
    const radius = parseFloat(style.borderTopLeftRadius)
    if (side >= 24 && radius > 0 && radius < side / 2 - 1)
      radii.push({ px: radius, sample: label(el) || el.tagName.toLowerCase() })
    const text = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent ?? '')
      .join('')
      .trim()
    if (text) {
      addColor(style.color, el)
      fontSizes.push({ px: parseFloat(style.fontSize), sample: text.slice(0, 30) })
      families.add(style.fontFamily.split(',')[0]!.trim().replace(/["']/g, ''))
      if (pictograph.test(text.replace(/[©®™]/g, ''))) emoji.push(text.slice(0, 30))
    }
  }
  const selector =
    'a[href], button, [role="button"], [role="link"], [role="tab"], [role="switch"], [role="checkbox"], input[type="submit"]'
  const inline = (el: Element) =>
    el.tagName === 'A' && getComputedStyle(el).display === 'inline' && !!el.closest('p, li')
  const actions = Array.from(document.body.querySelectorAll(selector))
    .map((el) => ({ el, rect: el.getBoundingClientRect() }))
    .filter(({ el, rect }) => rect.width > 0 && rect.height > 0 && !concealed(el))
    .map(({ el, rect }) => {
      const href = el.getAttribute('href') ?? ''
      return {
        label: label(el),
        href: href.startsWith('#') ? href : href.replace(/[?#].*$/, ''),
        x: Math.round(rect.left + scrollX),
        y: Math.round(rect.top + scrollY),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        inline: inline(el),
        main: !!el.closest('main'),
      }
    })
  return {
    colors: [...colors.values()],
    radii,
    fontSizes,
    fontFamilies: [...families].filter(Boolean),
    gradients: [...new Set(gradients)],
    emoji: [...new Set(emoji)],
    actions,
  }
}
