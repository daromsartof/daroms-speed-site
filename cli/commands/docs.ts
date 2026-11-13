import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Args } from '../lib/args.ts'
import { brokenLinks, buildCliDoc, buildLlms, buildLlmsFull } from '../lib/docs.ts'
import { readText, writeFile } from '../lib/fsx.ts'
import { fail, log } from '../lib/log.ts'
import { CORE_DIR } from '../lib/paths.ts'

/** dss docs: regenerates docs/cli.md, docs/llms.txt and docs/llms-full.txt; fails on broken links. */
export async function docs(_args: Args) {
  const dir = join(CORE_DIR, 'docs')
  const broken = brokenLinks(dir)
  if (broken.length) fail(`broken docs links:\n${broken.join('\n')}`)
  const outputs: [string, string][] = [
    [join(dir, 'cli.md'), buildCliDoc()],
    [join(dir, 'llms.txt'), buildLlms(dir)],
    [join(dir, 'llms-full.txt'), buildLlmsFull(dir, CORE_DIR)],
  ]
  for (const [file, content] of outputs) {
    if (existsSync(file) && readText(file) === content) continue
    writeFile(file, content)
    log.ok(`wrote ${file.replace(`${CORE_DIR}/`, '')}`)
  }
}
