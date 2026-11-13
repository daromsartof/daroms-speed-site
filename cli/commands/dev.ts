import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { bool, flag, type Args } from '../lib/args.ts'
import { run } from '../lib/exec.ts'
import { log } from '../lib/log.ts'
import { siteRoot } from '../lib/paths.ts'

const bridgeCli = (root: string) => join(root, 'core/packages/aimkit/dist/cli.js')

/** dss dev: next dev plus the AimKit bridge (browser element picker -> .claude-context/), unless --no-aimkit. */
export async function dev(args: Args) {
  const root = siteRoot()
  const port = flag(args, 'port') ?? '3000'
  const cli = bridgeCli(root)
  const bridge =
    !bool(args, 'no-aimkit') && existsSync(cli)
      ? spawn('node', [cli, '--quiet', '--origin', `http://localhost:${port}`], {
          cwd: root,
          stdio: 'inherit',
        })
      : undefined
  bridge?.on('exit', (code) => {
    if (code)
      log.warn(
        `AimKit bridge stopped (${code}): next dev keeps running; pnpm dss aimkit token to re-pair`,
      )
  })
  const stop = () => bridge?.kill()
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  const cmd = ['pnpm', 'exec', 'next', 'dev', '--port', port]
  if (bool(args, 'https')) cmd.push('--experimental-https')
  try {
    await run(cmd, { cwd: root, allowFailure: true })
  } finally {
    stop()
  }
}

/** dss aimkit setup|token|init: passes through to the vendored AimKit CLI. */
export async function aimkit(args: Args) {
  const root = siteRoot()
  const cli = bridgeCli(root)
  if (!existsSync(cli))
    return log.warn('AimKit is not vendored in this core (core/packages/aimkit)')
  const passthrough = [
    ...args._,
    ...Object.entries(args.flags).flatMap(([k, v]) =>
      v === true ? [`--${k}`] : [`--${k}`, String(v)],
    ),
  ]
  await run(['node', cli, ...passthrough], { cwd: root, allowFailure: true })
}
