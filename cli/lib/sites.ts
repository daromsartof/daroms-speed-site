import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { writeJson } from './fsx.ts'
import { brainDir } from './paths.ts'

export type Deployment = { env: 'preview' | 'production'; target: string; at: string; url?: string }
export type SiteRecord = {
  slug: string
  name: string
  path: string
  preset: string
  industry: string
  created: string
  url?: string
  deployments: Deployment[]
}

/** Registry of every site produced on this machine, next to the brain (~/.dss/sites.json). */
export const registryFile = () => join(dirname(brainDir()), 'sites.json')

export function readSites(): SiteRecord[] {
  const file = registryFile()
  if (!existsSync(file)) return []
  try {
    return (JSON.parse(readFileSync(file, 'utf8')) as { sites?: SiteRecord[] }).sites ?? []
  } catch {
    return []
  }
}

export function upsertSite(
  record: Omit<SiteRecord, 'deployments'> & { deployments?: Deployment[] },
) {
  const sites = readSites()
  const existing = sites.find((s) => s.slug === record.slug && s.path === record.path)
  const next = {
    ...existing,
    ...record,
    deployments: record.deployments ?? existing?.deployments ?? [],
  }
  writeJson(registryFile(), { sites: [...sites.filter((s) => s !== existing), next] })
}

export function recordDeployment(path: string, deployment: Deployment) {
  const sites = readSites()
  const site = sites.find((s) => s.path === path)
  if (!site) return
  site.deployments = [...site.deployments, deployment].slice(-20)
  if (deployment.env === 'production' && deployment.url) site.url = deployment.url
  writeJson(registryFile(), { sites })
}
