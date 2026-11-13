import { existsSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { flag, type Args } from '../lib/args.ts'
import { run } from '../lib/exec.ts'
import { readJson, writeFile, writeJson } from '../lib/fsx.ts'
import { fail, log } from '../lib/log.ts'
import { CORE_DIR, siteRoot } from '../lib/paths.ts'
import { loadManifest, saveManifest } from '../lib/site.ts'
import { ensureCorePackage } from '../lib/workspace.ts'

type Driver = 'd1' | 'libsql' | 'postgres'

const DRIVER_DEPS: Record<Driver, Record<string, string>> = {
  d1: {},
  libsql: { '@libsql/client': '0.18.0' },
  postgres: { postgres: '4.1.1' },
}
const DRIVER_ENV: Record<Driver, string> = {
  d1: '',
  libsql: '# db: libSQL file or Turso URL\nDATABASE_URL=file:./data/site.db\nDATABASE_AUTH_TOKEN=',
  postgres: '# db: Postgres connection string (server only)\nDATABASE_URL=',
}
const MIGRATE: Record<Driver, string> = {
  d1: 'wrangler d1 migrations apply DB --local',
  libsql: 'drizzle-kit migrate',
  postgres: 'drizzle-kit migrate',
}

const template = (name: string) => readFileSync(join(CORE_DIR, 'generators/db/files', name), 'utf8')
const jsonc = (text: string) =>
  JSON.parse(text.replace(/^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1')) as Record<
    string,
    unknown
  >

/** Adds the D1 binding to wrangler.jsonc (database_id is filled after `wrangler d1 create`). */
function addD1Binding(root: string) {
  const file = join(root, 'wrangler.jsonc')
  const config = jsonc(readFileSync(file, 'utf8'))
  const bindings = (config.d1_databases as { binding: string }[] | undefined) ?? []
  if (bindings.some((b) => b.binding === 'DB')) return
  const name = `${String(config.name ?? basename(root))}-db`
  config.d1_databases = [
    ...bindings,
    {
      binding: 'DB',
      database_name: name,
      database_id: 'replace-after-wrangler-d1-create',
      migrations_dir: 'server/db/migrations',
    },
  ]
  writeFile(file, `${JSON.stringify(config, null, 2)}\n`)
}

async function init(root: string, driver: Driver) {
  const { input } = await loadManifest(root)
  if (input.db?.driver && input.db.driver !== 'none' && input.db.driver !== driver) {
    fail(`site.manifest.ts already uses db.driver ${input.db.driver}`)
  }
  let install = ensureCorePackage(root, 'data')
  const pkgFile = join(root, 'package.json')
  const pkg = readJson<{
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    scripts?: Record<string, string>
  }>(pkgFile)
  const deps = { ...DRIVER_DEPS[driver] }
  const dev = { 'drizzle-kit': '0.31.11' }
  const sort = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).sort())
  if (
    Object.keys(deps).some((d) => !pkg.dependencies?.[d]) ||
    !pkg.devDependencies?.['drizzle-kit']
  )
    install = true
  pkg.dependencies = sort({ ...pkg.dependencies, ...deps })
  pkg.devDependencies = sort({ ...pkg.devDependencies, ...dev })
  pkg.scripts = {
    ...pkg.scripts,
    'db:generate': 'drizzle-kit generate',
    'db:migrate': MIGRATE[driver],
    'db:studio': 'drizzle-kit studio',
  }
  writeJson(pkgFile, pkg)

  const files: [string, string][] = [
    ['server/db/schema.ts', template(driver === 'postgres' ? 'schema-pg.ts' : 'schema-sqlite.ts')],
    ['server/db/client.ts', template(`client-${driver}.ts`)],
    ['drizzle.config.ts', template('drizzle.config.ts')],
  ]
  for (const [rel, content] of files) {
    if (existsSync(join(root, rel))) log.warn(`${rel} exists: kept`)
    else writeFile(join(root, rel), content)
  }
  if (DRIVER_ENV[driver]) {
    const envFile = join(root, '.env.example')
    const current = existsSync(envFile) ? readFileSync(envFile, 'utf8') : ''
    if (!/^DATABASE_URL=/m.test(current))
      writeFile(envFile, `${current.replace(/\s*$/, '')}\n\n${DRIVER_ENV[driver]}\n`)
  }
  if (driver === 'd1') addD1Binding(root)
  input.db = { driver }
  saveManifest(root, input)
  if (install) {
    log.step('installing @dss/data and Drizzle (pnpm install)')
    await run(['pnpm', 'install'], { cwd: root, quiet: true })
  }
  log.ok(`database ready (${driver}): server/db/schema.ts, server/db/client.ts, drizzle.config.ts`)
  log.info(
    driver === 'd1'
      ? 'next: pnpm db:generate && pnpm db:migrate (local). Production: wrangler d1 create, put the id in wrangler.jsonc, then wrangler d1 migrations apply DB --remote'
      : 'next: set DATABASE_URL in .env, then pnpm db:generate && pnpm db:migrate',
  )
}

/** dss db init [--driver d1|libsql|postgres] */
export async function db(args: Args) {
  const [sub] = args._
  const root = siteRoot()
  if (sub === 'init') {
    const { manifest } = await loadManifest(root)
    const fallback: Driver = manifest.deploy.target === 'cloudflare' ? 'd1' : 'libsql'
    const driver = (flag(args, 'driver') ?? fallback) as Driver
    if (!['d1', 'libsql', 'postgres'].includes(driver)) fail('driver: d1 | libsql | postgres')
    return init(root, driver)
  }
  fail(
    'usage: dss db init [--driver d1|libsql|postgres]  (then pnpm db:generate, pnpm db:migrate, pnpm db:studio)',
  )
}
