import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseArgs, list } from '../lib/args.ts'
import {
  appendSection,
  pageFile,
  renderContent,
  renderPage,
  sectionKeys,
  setNavLabel,
} from '../lib/codegen.ts'
import { pascal, kebab, render } from '../lib/fsx.ts'
import { listScenes, listSections, resolveSection } from '../lib/registry.ts'
import { CORE_DIR } from '../lib/paths.ts'
import { toTs } from '../lib/serialize.ts'

describe('args', () => {
  it('parses positionals, values, inline values and flags', () => {
    const a = parseArgs(['new', 'acme', '--preset', 'landing', '--mood=warm,bold', '--copy'])
    expect(a._).toEqual(['new', 'acme'])
    expect(a.flags).toEqual({ preset: 'landing', mood: 'warm,bold', copy: true })
    expect(list(a, 'mood')).toEqual(['warm', 'bold'])
  })
})

describe('serialize', () => {
  it('writes readable TypeScript literals', () => {
    expect(toTs({ name: "O'Neil", pages: [{ route: '/' }], tags: ['a', 'b'], 'x-y': 1 })).toBe(
      "{\n  name: 'O\\'Neil',\n  pages: [\n    {\n      route: '/',\n    },\n  ],\n  tags: ['a', 'b'],\n  'x-y': 1,\n}",
    )
  })
})

describe('fsx', () => {
  it('renders templates and cases', () => {
    expect(render('{{Name}}/{{x}}', { Name: 'Hero' })).toBe('Hero/{{x}}')
    expect(pascal('case-studies')).toBe('CaseStudies')
    expect(kebab('Case Studies')).toBe('case-studies')
  })
})

describe('codegen', () => {
  it('maps routes to page files', () => {
    expect(pageFile('/')).toBe('app/page.tsx')
    expect(pageFile('/services/web')).toBe('app/services/web/page.tsx')
  })

  it('keys repeated sections', () => {
    expect(sectionKeys(['hero', 'faq', 'faq', 'case-study'])).toEqual([
      'hero',
      'faq',
      'faq2',
      'caseStudy',
    ])
  })

  it('types internal hrefs as routes in content files', () => {
    const ts = renderContent('home', { title: 't', description: 'd' }, [
      { key: 'hero', value: { primary: { href: '/contact' }, out: { href: 'https://x.y' } } },
    ])
    expect(ts).toContain("import type { Route } from 'next'")
    expect(ts).toContain("href: '/contact' as Route")
    expect(ts).toContain("href: 'https://x.y',")
    expect(ts).toContain('export const home = {')
  })

  it('renders thin pages with metadata', () => {
    const tsx = renderPage('/about', 'about', [
      { component: 'Hero', importPath: '@/components/sections/hero', key: 'hero' },
      { component: 'Cta', importPath: '@/components/sections/cta', key: 'cta' },
    ])
    expect(tsx).toContain("pageMetadata(manifest, { ...about.meta, path: '/about' })")
    expect(tsx).toContain('<Hero {...about.hero} />')
    expect(tsx).toContain('export default function AboutPage()')
  })

  it('sets nav labels without duplicating routes', () => {
    const root = mkdtempSync(join(tmpdir(), 'dss-'))
    const file = join(root, 'content/site.ts')
    mkdirSync(join(root, 'content'))
    writeFileSync(
      file,
      "export const site = {\n  nav: { '/': 'Home' } as Record<string, string>,\n}\n",
    )
    setNavLabel(root, '/about', "Who we're")
    setNavLabel(root, '/about', 'Ignored')
    expect(readFileSync(file, 'utf8')).toContain("nav: { '/': 'Home', '/about': 'Who we\\'re' }")
  })

  it('appends a section to a generated page', () => {
    const root = mkdtempSync(join(tmpdir(), 'dss-'))
    mkdirSync(join(root, 'app'), { recursive: true })
    mkdirSync(join(root, 'content'))
    writeFileSync(
      join(root, 'app/page.tsx'),
      renderPage('/', 'home', [
        { component: 'Hero', importPath: '@/components/sections/hero', key: 'hero' },
      ]),
    )
    writeFileSync(
      join(root, 'content/home.ts'),
      renderContent('home', { title: 't', description: 'd' }, [
        { key: 'hero', value: { title: 'x' } },
      ]),
    )
    const ok = appendSection(
      root,
      '/',
      'home',
      { component: 'Cta', importPath: '@/components/sections/cta', key: 'cta' },
      { action: { href: '/contact' } },
    )
    expect(ok).toBe(true)
    const page = readFileSync(join(root, 'app/page.tsx'), 'utf8')
    expect(page).toContain("import { Cta } from '@/components/sections/cta'")
    expect(page).toMatch(/<Cta \{\.\.\.home\.cta\} \/>\n {4}<\/main>/)
    const content = readFileSync(join(root, 'content/home.ts'), 'utf8')
    expect(content).toContain("href: '/contact' as Route")
    expect(content.startsWith("import type { Route } from 'next'")).toBe(true)
  })
})

describe('registry', () => {
  it('reads every section with a version stamp and valid fits', () => {
    const sections = listSections()
    expect(sections.length).toBeGreaterThanOrEqual(10)
    for (const s of sections) {
      expect(s.version, `${s.id}/${s.variant}`).not.toBe('0.0.0')
      expect(s.component).toMatch(/^[A-Z]\w+$/)
      const source = readFileSync(join(s.dir, 'section.tsx'), 'utf8')
      expect(source, `${s.id} exports ${s.component}`).toContain(`export function ${s.component}(`)
      expect(source).toContain('@catalog')
    }
  })

  it('picks a fitting variant with the seed and respects the DNA 3D level', () => {
    expect(resolveSection('hero', 'craft').fits).toContain('craft')
    expect(resolveSection('hero', 'tech-noir', 'seed-a', false).needs?.scenes ?? []).toEqual([])
    const picks = new Set(
      Array.from({ length: 20 }, (_, i) => resolveSection('hero', 'tech-noir', `s${i}`).variant),
    )
    expect(picks.size).toBeGreaterThan(1)
    expect(() => resolveSection('nope')).toThrow(/unknown section/)
  })

  it('declares only scenes that exist, and every scene file exists', () => {
    const scenes = listScenes()
    for (const s of listSections())
      for (const id of s.needs?.scenes ?? []) expect(scenes.map((x) => x.id)).toContain(id)
    for (const scene of scenes)
      for (const f of scene.files) expect(existsSync(join(scene.dir, f)), f).toBe(true)
  })

  it('every preset only uses registry sections', () => {
    const ids = new Set(listSections().map((s) => s.id))
    const dir = join(CORE_DIR, 'template/presets')
    for (const preset of readdirSync(dir)) {
      const data = JSON.parse(readFileSync(join(dir, preset, 'preset.json'), 'utf8')) as {
        pages: { sections: string[] }[]
      }
      for (const page of data.pages)
        for (const id of page.sections)
          expect(ids.has(id.split('/')[0] as string), `${preset}: ${id}`).toBe(true)
    }
  })
})
