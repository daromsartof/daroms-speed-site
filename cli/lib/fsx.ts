import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative } from 'node:path'

export function copyDir(from: string, to: string, skip: (rel: string) => boolean = () => false) {
  cpSync(from, to, { recursive: true, filter: (src) => !skip(relative(from, src)) })
}

export function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === '.next') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else out.push(path)
  }
  return out
}

/** Generator templates: {{Name}}, {{name}}, {{route}}... Unknown keys are left in place. */
export function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => vars[key] ?? match)
}

export function writeFile(path: string, content: string | Uint8Array) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

export function readText(path: string): string {
  return readFileSync(path, 'utf8')
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

export function writeJson(path: string, value: unknown) {
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
}

export const pascal = (s: string) =>
  s.replace(/(^|[-_ /])(\w)/g, (_m, _sep, c: string) => c.toUpperCase())
export const camel = (s: string) => pascal(s).replace(/^\w/, (c) => c.toLowerCase())
export const kebab = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
