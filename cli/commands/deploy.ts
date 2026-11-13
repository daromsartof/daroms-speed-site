import { basename } from 'node:path'
import { bool, flag, type Args } from '../lib/args.ts'
import { capture, run } from '../lib/exec.ts'
import { color, fail, log } from '../lib/log.ts'
import { siteRoot } from '../lib/paths.ts'
import { recordDeployment } from '../lib/sites.ts'
import { loadManifest } from '../lib/site.ts'

const URL_RE = /https:\/\/[\w.-]+\.(?:workers\.dev|vercel\.app)[^\s]*/

/**
 * dss deploy [--prod] [--target cloudflare|vercel|docker] [--force]
 * Preview builds run with DSS_ENV=preview (robots disallow, noindex); production rebuilds without it.
 */
export async function deploy(args: Args) {
  const root = siteRoot()
  const { manifest } = await loadManifest(root)
  const prod = bool(args, 'prod')
  const env = prod ? 'production' : 'preview'
  const target = flag(args, 'target') ?? manifest.deploy.target
  if (prod && manifest.url.endsWith('.example'))
    fail(`site url is ${manifest.url}: set the real domain in site.manifest.ts first`)
  if (!bool(args, 'force')) {
    const { doctor } = await import('./doctor.ts')
    try {
      await doctor({ _: [], flags: { strict: prod, quick: true } })
    } catch (error) {
      fail(
        `doctor failed: fix it or pass --force.\n${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
  const buildEnv = { DSS_ENV: env }
  log.step(`${env} deploy to ${target}`)
  let output = ''
  if (target === 'cloudflare') {
    await run(['pnpm', 'exec', 'opennextjs-cloudflare', 'build'], { cwd: root, env: buildEnv })
    const result = await capture(
      ['pnpm', 'exec', 'opennextjs-cloudflare', prod ? 'deploy' : 'upload'],
      { cwd: root, env: buildEnv },
    )
    output = result.out
    process.stdout.write(output.split('\n').slice(-15).join('\n'))
    if (result.code !== 0) {
      fail(
        /not authenticated|login|CLOUDFLARE_API_TOKEN/i.test(output)
          ? 'Cloudflare login needed: run `! pnpm exec wrangler login` (or set CLOUDFLARE_API_TOKEN)'
          : 'Cloudflare deploy failed (see above)',
      )
    }
  } else if (target === 'vercel') {
    const result = await capture(
      ['npx', '-y', 'vercel@latest', 'deploy', ...(prod ? ['--prod'] : []), '--yes'],
      { cwd: root },
    )
    output = result.out
    process.stdout.write(output.split('\n').slice(-10).join('\n'))
    if (result.code !== 0)
      fail('Vercel deploy failed: run `! npx vercel login` and `npx vercel link` once')
  } else if (target === 'docker') {
    const tag = `${basename(root)}:${env}`
    await run(['docker', 'build', '--build-arg', `DSS_ENV=${env}`, '-t', tag, '.'], { cwd: root })
    output = tag
    log.info(`image ${tag} built: push it to your registry or run it behind a TLS proxy`)
  } else fail(`unknown target ${target}`)
  const url = URL_RE.exec(output)?.[0]
  recordDeployment(root, { env, target, at: new Date().toISOString(), ...(url ? { url } : {}) })
  log.ok(`${env} deployed${url ? `: ${color.bold(url)}` : ''}`)
  if (!prod)
    log.info('previews are noindexed (DSS_ENV=preview). Production: pnpm dss deploy --prod')
}
