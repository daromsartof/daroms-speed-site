import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Args } from '../lib/args.ts'
import { buildCatalog, buildDigest } from '../lib/ai.ts'
import { run } from '../lib/exec.ts'
import { readText, writeFile } from '../lib/fsx.ts'
import { log } from '../lib/log.ts'
import { CORE_DIR, siteRoot } from '../lib/paths.ts'

/** dss catalog: regenerates core/CATALOG.md and _ai/digest.md (core repository). */
export async function catalog(_args: Args) {
  const outputs: [string, string][] = [
    [join(CORE_DIR, 'CATALOG.md'), buildCatalog(CORE_DIR)],
    [join(CORE_DIR, '_ai', 'digest.md'), buildDigest(join(CORE_DIR, '_ai'))],
  ]
  for (const [file, content] of outputs) {
    if (existsSync(file) && readText(file) === content) continue
    writeFile(file, content)
    log.ok(`wrote ${file.replace(`${CORE_DIR}/`, '')}`)
  }
}

/** dss sync-ai: copies core/_ai into .claude/ and rebuilds the routing index. */
export async function syncAi(_args: Args) {
  const root = siteRoot()
  const env = { CLAUDE_PROJECT_DIR: root }
  await run(['python3', join(root, 'core/_ai/hooks/dss-sync.py'), '--force'], { cwd: root, env })
  await run(['python3', join(root, '.claude/hooks/dss-context.py'), 'build'], { cwd: root, env })
  log.ok('AI layer synced into .claude/')
}
