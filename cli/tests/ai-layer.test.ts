import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CORE_DIR } from '../lib/paths.ts'

const ai = join(CORE_DIR, '_ai')
const frontmatter = (text: string) =>
  Object.fromEntries(
    (/^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? '')
      .split('\n')
      .map((l) => /^([\w-]+):\s*(.*)$/.exec(l))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => [m[1], m[2]]),
  )

describe('AI layer', () => {
  it('keeps the kernel under 70 lines', () => {
    expect(readFileSync(join(ai, 'CLAUDE.core.md'), 'utf8').split('\n').length).toBeLessThanOrEqual(
      70,
    )
  })

  it('dss skills are named after their folder, described, and short', () => {
    const skills = readdirSync(join(ai, 'skills')).filter((d) => d.startsWith('dss-'))
    expect(skills.length).toBeGreaterThanOrEqual(15)
    for (const dir of skills) {
      const text = readFileSync(join(ai, 'skills', dir, 'SKILL.md'), 'utf8')
      const meta = frontmatter(text)
      expect(meta.name, dir).toBe(dir)
      expect((meta.description ?? '').length, dir).toBeGreaterThan(40)
      expect(text.split('\n').length, `${dir} is too long`).toBeLessThanOrEqual(45)
      if (meta.context === 'fork') expect(['sonnet', 'haiku'], dir).toContain(meta.model)
    }
  })

  it('agents declare tools and a model', () => {
    for (const file of readdirSync(join(ai, 'agents'))) {
      const meta = frontmatter(readFileSync(join(ai, 'agents', file), 'utf8'))
      expect(meta.name, file).toBe(file.replace(/\.md$/, ''))
      expect(meta.tools, file).toBeTruthy()
      expect(meta.model, file).toBe('sonnet')
    }
  })

  it('wires only existing hooks and loads every vendored skill name-only', () => {
    const settings = JSON.parse(readFileSync(join(ai, 'settings.json'), 'utf8')) as {
      hooks: Record<string, { hooks: { command: string }[] }[]>
      skillOverrides: Record<string, string>
    }
    const commands = Object.values(settings.hooks).flatMap((groups) =>
      groups.flatMap((g) => g.hooks.map((h) => h.command)),
    )
    for (const command of commands) {
      const script = /(dss-[\w-]+\.py)/.exec(command)?.[1]
      expect(script && existsSync(join(ai, 'hooks', script)), command).toBe(true)
    }
    const vendored = readdirSync(join(ai, 'skills', 'vendor')).filter((d) => !d.endsWith('.md'))
    expect(Object.keys(settings.skillOverrides).sort()).toEqual(vendored.sort())
    for (const dir of vendored) {
      const files = readdirSync(join(ai, 'skills', 'vendor', dir))
      expect(
        files.some((f) => /^LICENSE/.test(f)),
        `${dir} has a license`,
      ).toBe(true)
      expect(
        frontmatter(readFileSync(join(ai, 'skills', 'vendor', dir, 'SKILL.md'), 'utf8')).name,
        dir,
      ).toBe(dir)
    }
  })

  it('every rule file has a one-line summary and path rules have globs', () => {
    for (const folder of ['rules', 'rules-ondemand']) {
      for (const file of readdirSync(join(ai, folder))) {
        const text = readFileSync(join(ai, folder, file), 'utf8')
        expect(text, file).toMatch(/^> .{20,}$/m)
        if (folder === 'rules') expect(text, file).toMatch(/^paths:\n {2}- "/m)
      }
    }
  })
})
