import { bool, flag, type Args } from '../lib/args.ts'
import { run } from '../lib/exec.ts'
import { siteRoot } from '../lib/paths.ts'

/** dss dev: next dev (the AimKit bridge joins it once vendored). */
export async function dev(args: Args) {
  const root = siteRoot()
  const cmd = ['pnpm', 'exec', 'next', 'dev', '--port', flag(args, 'port') ?? '3000']
  if (bool(args, 'https')) cmd.push('--experimental-https')
  await run(cmd, { cwd: root })
}
