/** Whether a scene may run: WebGL present, motion allowed, DNA three level not "none". */
export function canRunScene(win: Window = window): boolean {
  if (win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  if (win.document.documentElement.dataset.three === 'none') return false
  try {
    const canvas = win.document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}
