import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { bool, flag, type Args } from '../lib/args.ts'
import { capture, has } from '../lib/exec.ts'
import { color, fail, log } from '../lib/log.ts'
import { siteRoot } from '../lib/paths.ts'
import { collectMeasures } from '../lib/taste-page.ts'
import { failing, scoreMeasures, themeRef, type Metric, type ThemeRef } from '../lib/taste.ts'

// The few Playwright calls used here, typed locally: playwright-core lives in the site, not the core.
type PwPage = {
  on(event: 'console', listener: (msg: { type(): string; text(): string }) => void): void
  on(event: 'pageerror', listener: (error: Error) => void): void
  goto(url: string, options: object): Promise<{ status(): number } | null>
  waitForTimeout(ms: number): Promise<void>
  evaluate<T>(fn: () => T): Promise<T>
  evaluate<T, A>(fn: (arg: A) => T, arg: A): Promise<T>
  screenshot(options: object): Promise<unknown>
}
type PwBrowser = { newPage(options: object): Promise<PwPage>; close(): Promise<void> }
type Playwright = { chromium: { launch(options?: object): Promise<PwBrowser> } }

export type ShotReport = {
  route: string
  width: number
  status: number
  errors: string[]
  overflow: string[]
  headings: { h1: string[]; h2: number }
  taste: Metric[]
  shot?: string
}

const DEFAULT_PORT = 3123
const IGNORED = [/Download the React DevTools/, /\[HMR\]/, /\[Fast Refresh\]/, /favicon/]

function loadPlaywright(root: string): Playwright {
  try {
    return createRequire(join(root, 'package.json'))('playwright-core') as Playwright
  } catch {
    return fail('playwright-core is missing: pnpm add -D playwright-core')
  }
}

async function launch(pw: Playwright): Promise<PwBrowser> {
  return pw.chromium
    .launch()
    .catch(() =>
      pw.chromium
        .launch({ channel: 'chrome' })
        .catch(() =>
          fail(
            'no Chromium for Playwright: npx playwright-core install chromium (or install Chrome)',
          ),
        ),
    )
}

async function serverUp(url: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500), redirect: 'manual' })
    return res.status > 0
  } catch {
    return false
  }
}

/** Starts `next dev` in the background on a dedicated port, reused until `dss shot --stop`. */
async function ensureServer(root: string, port: number) {
  const url = `http://localhost:${port}`
  if (await serverUp(url)) return url
  log.step(`starting next dev on port ${port} (stop with pnpm dss shot --stop)`)
  mkdirSync(join(root, '.dss'), { recursive: true })
  const out = openSync(join(root, '.dss', 'web-server.log'), 'w')
  const server = spawn('pnpm', ['exec', 'next', 'dev', '--port', String(port)], {
    cwd: root,
    detached: true,
    stdio: ['ignore', out, out],
    env: { ...process.env, BROWSER: 'none', NEXT_TELEMETRY_DISABLED: '1' },
  })
  server.unref()
  writeFileSync(join(root, '.dss', 'web.pid'), String(server.pid))
  for (let i = 0; i < 120; i++) {
    if (await serverUp(url)) return url
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  return fail('next dev did not answer in 120 s (see .dss/web-server.log)')
}

async function stopServer(root: string, port: number) {
  const pids = new Set<number>()
  const pidFile = join(root, '.dss', 'web.pid')
  if (existsSync(pidFile)) pids.add(-Number(readFileSync(pidFile, 'utf8')))
  if (has('lsof')) {
    const { out } = await capture(['lsof', '-ti', `tcp:${port}`, '-sTCP:LISTEN'])
    for (const line of out.split('\n')) if (/^\d+$/.test(line.trim())) pids.add(Number(line.trim()))
  }
  let stopped = 0
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM')
      stopped += 1
    } catch {
      // already gone
    }
  }
  rmSync(pidFile, { force: true })
  log.ok(stopped ? 'next dev stopped' : 'no server running')
}

/** Renders one route at one width: errors, horizontal overflow, headings, taste measures. */
export async function inspect(
  browser: PwBrowser,
  options: { base: string; route: string; width: number; shotPath: string; force: boolean },
  theme?: ThemeRef,
): Promise<ShotReport> {
  const { base, route, width, shotPath, force } = options
  const report: ShotReport = {
    route,
    width,
    status: 0,
    errors: [],
    overflow: [],
    headings: { h1: [], h2: 0 },
    taste: [],
  }
  const page = await browser.newPage({
    viewport: { width, height: width < 768 ? 844 : 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  page.on('console', (msg) => {
    const text = msg.text().split('\n')[0]!.slice(0, 220)
    if (msg.type() === 'error' && !IGNORED.some((re) => re.test(text))) report.errors.push(text)
  })
  page.on('pageerror', (error) => report.errors.push(`exception: ${error.message.split('\n')[0]}`))
  const response = await page.goto(`${base}${route.startsWith('/') ? route : `/${route}`}`, {
    waitUntil: 'networkidle',
    timeout: 120_000,
  })
  report.status = response?.status() ?? 0
  // scroll once to the bottom: lazy images and in-view reveals render before measuring
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) {
      scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 60))
    }
    scrollTo(0, 0)
  })
  await page.waitForTimeout(400)
  const layout = await page.evaluate((viewport: number) => {
    const label = (el: Element) =>
      (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40) || el.tagName.toLowerCase()
    const inScroller = (el: Element) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX
        if (
          (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') &&
          p !== document.body
        )
          return true
      }
      return false
    }
    const overflow: string[] = []
    if (document.documentElement.scrollWidth > viewport + 1) {
      for (const el of Array.from(document.body.querySelectorAll('*'))) {
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.right <= viewport + 1 || inScroller(el)) continue
        const parent = el.parentElement?.getBoundingClientRect()
        if (parent && parent.right > viewport + 1) continue
        overflow.push(`${Math.round(rect.right)}px wide: ${label(el)}`)
        if (overflow.length === 5) break
      }
      if (!overflow.length) overflow.push(`page is ${document.documentElement.scrollWidth}px wide`)
    }
    const h1 = Array.from(document.querySelectorAll('h1')).map((h) => label(h))
    return { overflow, headings: { h1, h2: document.querySelectorAll('h2').length } }
  }, width)
  report.overflow = layout.overflow
  report.headings = layout.headings
  report.taste = scoreMeasures(await page.evaluate(collectMeasures), theme)
  if (force || report.errors.length || report.overflow.length || report.status >= 400) {
    await page.screenshot({ path: shotPath, fullPage: true })
    report.shot = shotPath
  }
  return report
}

export function printReport(report: ShotReport) {
  const broken = report.errors.length || report.overflow.length || report.status >= 400
  const status = broken ? color.red('to fix') : color.green('ok')
  console.log(`${color.bold(report.route)} [${report.width}] ${report.status}: ${status}`)
  for (const error of report.errors.slice(0, 8)) console.log(`  ${color.red('error')} ${error}`)
  for (const o of report.overflow) console.log(`  ${color.yellow('overflow')} ${o}`)
  const { h1, h2 } = report.headings
  const h1Line = h1.length === 1 ? `h1 "${h1[0]}"` : color.yellow(`${h1.length} h1 (want 1)`)
  console.log(color.dim(`  headings: ${h1Line} · ${h2} h2`))
  const bad = failing(report.taste)
  if (!bad.length) {
    const summary = report.taste.map((m) => `${m.label} ${m.value}/${m.max}`).join(' · ')
    console.log(color.dim(`  measures ok: ${summary}`))
  }
  for (const m of bad) {
    const detail = m.detail.length ? ` ${color.dim(m.detail.slice(0, 4).join(' | '))}` : ''
    console.log(`  ${color.yellow('measure')} ${m.label}: ${m.value} (max ${m.max})${detail}`)
  }
  if (report.shot) console.log(`  capture: ${report.shot}`)
}

/** dss shot <route>: text report first (errors, overflow, measures), capture only when useful. */
export async function shot(args: Args) {
  const root = siteRoot()
  const port = Number(flag(args, 'port') ?? DEFAULT_PORT)
  if (bool(args, 'stop')) return stopServer(root, port)
  const route = args._[0] ?? '/'
  const base = flag(args, 'url')?.replace(/\/$/, '') ?? (await ensureServer(root, port))
  const widths = (flag(args, 'width') ?? '1440,390').split(',').map(Number).filter(Boolean)
  const themeFile = join(root, 'app', 'theme.css')
  const theme = existsSync(themeFile) ? themeRef(readFileSync(themeFile, 'utf8')) : undefined
  const dir = join(root, '.dss', 'shots')
  mkdirSync(dir, { recursive: true })
  const slug = route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'
  const browser = await launch(loadPlaywright(root))
  try {
    for (const width of widths) {
      const shotPath = join(dir, `${slug}-${width}.png`)
      const report = await inspect(
        browser,
        { base, route, width, shotPath, force: bool(args, 'capture') },
        theme,
      )
      printReport(report)
      if (report.errors.length || report.status >= 400) process.exitCode = 1
    }
  } finally {
    await browser.close()
  }
}
