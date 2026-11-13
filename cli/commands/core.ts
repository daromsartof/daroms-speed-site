import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { bool, type Args } from '../lib/args.ts'
import { capture, run } from '../lib/exec.ts'
import { readJson, writeJson } from '../lib/fsx.ts'
import { color, fail, log } from '../lib/log.ts'
import { CORE_DIR, isCoreRepo } from '../lib/paths.ts'

type Bump = 'patch' | 'minor' | 'major'

export function bumpVersion(version: string, bump: Bump): string {
  const [major = 0, minor = 0, patch = 0] = version.trim().split('.').map(Number)
  if (bump === 'major') return `${major + 1}.0.0`
  if (bump === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

const SECTIONS: [RegExp, string][] = [
  [/^feat/, 'Features'],
  [/^fix/, 'Fixes'],
  [/^(perf|refactor)/, 'Improvements'],
  [/^docs/, 'Documentation'],
]

/** Groups conventional commit subjects into changelog sections (ported from daroms-speed-app). */
export function changelogSection(
  version: string,
  date: string,
  subjects: readonly string[],
): string {
  const groups = new Map<string, string[]>()
  for (const subject of subjects) {
    const title = SECTIONS.find(([re]) => re.test(subject))?.[1] ?? 'Other'
    groups.set(title, [...(groups.get(title) ?? []), subject.replace(/^\w+(\([^)]*\))?!?:\s*/, '')])
  }
  const body = [...groups]
    .map(([title, items]) => `### ${title}\n${items.map((i) => `- ${i}`).join('\n')}`)
    .join('\n\n')
  return `## v${version} (${date})\n\n${body || '- Maintenance'}\n`
}

function setPackageVersions(version: string) {
  const files = [join(CORE_DIR, 'package.json')]
  for (const group of ['packages', 'modules']) {
    const dir = join(CORE_DIR, group)
    if (existsSync(dir))
      for (const name of readdirSync(dir)) files.push(join(dir, name, 'package.json'))
  }
  for (const file of files.filter(existsSync))
    writeJson(file, { ...readJson<Record<string, unknown>>(file), version })
}

/** dss release-core <patch|minor|major> [--dry]: version, changelog, commit and tag of the core. */
export async function releaseCore(args: Args) {
  if (!isCoreRepo()) fail('run release-core from the daroms-speed-site repository, not from a site')
  const bump = (args._[0] ?? 'patch') as Bump
  if (!['patch', 'minor', 'major'].includes(bump))
    fail('usage: dss release-core <patch|minor|major> [--dry]')
  const status = await capture(['git', '-C', CORE_DIR, 'status', '--porcelain'])
  if (status.out.trim() && !bool(args, 'dry'))
    fail('the core working tree is not clean: commit first')
  const current = readFileSync(join(CORE_DIR, 'VERSION'), 'utf8').trim()
  const next = bumpVersion(current, bump)
  const lastTag = await capture(['git', '-C', CORE_DIR, 'describe', '--tags', '--abbrev=0'])
  const range = lastTag.code === 0 ? `${lastTag.out.trim()}..HEAD` : 'HEAD'
  const history = await capture([
    'git',
    '-C',
    CORE_DIR,
    'log',
    range,
    '--no-merges',
    '--pretty=format:%s',
  ])
  const subjects = history.out.split('\n').filter((s) => s && !s.startsWith('chore(release)'))
  const section = changelogSection(next, new Date().toISOString().slice(0, 10), subjects)
  if (bool(args, 'dry')) return console.log(`${current} -> ${next}\n\n${section}`)
  writeFileSync(join(CORE_DIR, 'VERSION'), `${next}\n`)
  setPackageVersions(next)
  const changelog = join(CORE_DIR, 'CHANGELOG.md')
  const text = readFileSync(changelog, 'utf8')
  const head = text.indexOf('\n## ')
  writeFileSync(
    changelog,
    head >= 0
      ? `${text.slice(0, head + 1)}${section}\n${text.slice(head + 1)}`
      : `${text}\n${section}`,
  )
  await run(['git', '-C', CORE_DIR, 'add', '-A'], { quiet: true })
  await run(['git', '-C', CORE_DIR, 'commit', '-q', '-m', `chore(release): v${next}`], {
    quiet: true,
  })
  await run(['git', '-C', CORE_DIR, 'tag', `v${next}`], { quiet: true })
  log.ok(`v${next} committed and tagged`)
  console.log(
    `\n  git push && git push origin v${next}   ${color.dim('# publish.yml publishes to npm')}\n  sites: pnpm dss upgrade\n`,
  )
}
