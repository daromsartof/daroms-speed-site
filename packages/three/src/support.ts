type Connection = { saveData?: boolean }

/**
 * Whether a scene may run: WebGL present, motion allowed, DNA three level not "none", data saver off,
 * and the viewport at least `minWidth` (phones keep the poster: battery and main-thread budget).
 */
export function canRunScene(win: Window = window, minWidth = 768): boolean {
  if (win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  if (win.document.documentElement.dataset.three === 'none') return false
  if ((win.navigator as Navigator & { connection?: Connection }).connection?.saveData) return false
  if (minWidth > 0 && win.innerWidth < minWidth) return false
  try {
    const canvas = win.document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/** Runs `task` when the main thread is idle (after first paint and hydration), with a fallback delay. */
export function whenIdle(task: () => void, timeout = 2500): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(task, { timeout })
    return () => window.cancelIdleCallback(id)
  }
  const id = window.setTimeout(task, 1200)
  return () => window.clearTimeout(id)
}
