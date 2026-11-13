import { readFileSync, realpathSync, rmSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { bool, flag, type Args } from './args.ts'
import { capture, run } from './exec.ts'
import { copyDir } from './fsx.ts'
import { log } from './log.ts'
import { CORE_DIR } from './paths.ts'

const DEFAULT_CORE_URL = 'https://github.com/daromsartof/daroms-speed-site.git'
const CORE_SKIP =
  /^(node_modules|\.git|\.dss|dist|coverage|test-results|docs\/dist|docs\/\.astro)(\/|$)|\/node_modules(\/|$)/

async function coreIsCheckout(): Promise<boolean> {
  const { code, out } = await capture(['git', '-C', CORE_DIR, 'rev-parse', '--show-toplevel'])
  return code === 0 && realpathSync(out.trim()) === realpathSync(CORE_DIR)
}

/**
 * Attaches the framework at `core/`: --link (symlink, framework development), --copy (snapshot, client
 * handoff) or a git submodule pinned to the creating commit or the release tag (default).
 */
export async function attachCore(dest: string, args: Args) {
  if (bool(args, 'link')) {
    symlinkSync(CORE_DIR, join(dest, 'core'), 'dir')
    return log.ok('core linked (symlink, for framework development)')
  }
  const copy = () => copyDir(CORE_DIR, join(dest, 'core'), (rel) => CORE_SKIP.test(rel))
  if (bool(args, 'copy')) {
    copy()
    return log.ok('core copied (self-contained snapshot, for client handoff)')
  }
  const checkout = await coreIsCheckout()
  const url = flag(args, 'core') ?? (checkout ? await checkoutUrl() : DEFAULT_CORE_URL)
  const added = await run(
    ['git', '-c', 'protocol.file.allow=always', 'submodule', 'add', '-q', url, 'core'],
    {
      cwd: dest,
      allowFailure: true,
      quiet: true,
      env: { GIT_TERMINAL_PROMPT: '0' },
    },
  )
  if (added !== 0) {
    log.warn(
      `${url} unreachable: copying the installed core instead (pass --core <url> for a submodule)`,
    )
    // A failed clone leaves core/.git and .git/modules/core behind: git would see an empty submodule.
    for (const leftover of ['core', '.git/modules/core', '.gitmodules']) {
      rmSync(join(dest, leftover), { recursive: true, force: true })
    }
    copy()
    return
  }
  const tag = `v${readFileSync(join(CORE_DIR, 'VERSION'), 'utf8').trim()}`
  if (checkout) {
    // From a working copy: pin the submodule to the exact commit that created the site.
    const { out } = await capture(['git', '-C', CORE_DIR, 'rev-parse', 'HEAD'])
    await run(['git', '-C', 'core', 'checkout', '-q', out.trim()], {
      cwd: dest,
      allowFailure: true,
      quiet: true,
    })
    return log.ok(`core added as a submodule (${url}, ${out.trim().slice(0, 7)})`)
  }
  const pinned = await run(['git', '-C', 'core', 'checkout', '-q', tag], {
    cwd: dest,
    allowFailure: true,
    quiet: true,
  })
  log.ok(
    pinned === 0
      ? `core submodule pinned to ${tag}`
      : `core submodule on default branch (${tag} not found)`,
  )
}

/** The origin remote when it already has HEAD; otherwise the local checkout (unpushed core work). */
async function checkoutUrl(): Promise<string> {
  const origin = await capture(['git', '-C', CORE_DIR, 'remote', 'get-url', 'origin'])
  const pushed = await capture(['git', '-C', CORE_DIR, 'branch', '-r', '--contains', 'HEAD'])
  if (origin.code === 0 && pushed.code === 0 && pushed.out.trim()) return origin.out.trim()
  log.warn(
    'core HEAD is not pushed: the submodule points to the local checkout (pass --core <url> before sharing)',
  )
  return CORE_DIR
}
