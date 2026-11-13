import { spawn, spawnSync } from 'node:child_process'
import { fail } from './log.ts'

export type RunOptions = {
  cwd?: string
  env?: Record<string, string>
  quiet?: boolean
  allowFailure?: boolean
}

/** Runs a command attached to the terminal; throws when it fails unless allowFailure. */
export function run(cmd: readonly string[], options: RunOptions = {}): Promise<number> {
  return new Promise((resolve, reject) => {
    const [bin, ...rest] = cmd as [string, ...string[]]
    const child = spawn(bin, rest, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: options.quiet ? 'ignore' : 'inherit',
    })
    child.on('error', reject)
    child.on('close', (code) => {
      const exit = code ?? 1
      if (exit !== 0 && !options.allowFailure) {
        try {
          fail(`failed (${exit}): ${cmd.join(' ')}`)
        } catch (error) {
          reject(error)
          return
        }
      }
      resolve(exit)
    })
  })
}

/** Runs and captures stdout + stderr without printing. */
export function capture(
  cmd: readonly string[],
  options: RunOptions = {},
): Promise<{ code: number; out: string }> {
  return new Promise((resolve, reject) => {
    const [bin, ...rest] = cmd as [string, ...string[]]
    const child = spawn(bin, rest, { cwd: options.cwd, env: { ...process.env, ...options.env } })
    let out = ''
    child.stdout.on('data', (d: Buffer) => (out += d.toString()))
    child.stderr.on('data', (d: Buffer) => (out += d.toString()))
    child.on('error', reject)
    child.on('close', (code) => resolve({ code: code ?? 1, out }))
  })
}

export function has(binary: string): boolean {
  return spawnSync('which', [binary], { stdio: 'ignore' }).status === 0
}

/** Last N non-empty lines (frugal output for Claude). */
export function tail(text: string, lines = 20): string {
  return text
    .split('\n')
    .filter((l) => l.trim())
    .slice(-lines)
    .join('\n')
}
