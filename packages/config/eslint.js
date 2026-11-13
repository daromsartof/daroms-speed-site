// @ts-check
/**
 * Flat ESLint config shared by the core and every generated site.
 * Rules mirror the guard hook (_ai/hooks/dss-check-rules.py) so a violation is caught
 * before the write (hook) and again in CI (lint). Escape hatch: `// eslint-disable-next-line`
 * with a reason, never a blanket disable.
 */
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

const IGNORES = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.next/**',
  '**/.open-next/**',
  '**/.wrangler/**',
  '**/out/**',
  '**/coverage/**',
  '**/next-env.d.ts',
  '**/cloudflare-env.d.ts',
]

/** Rules common to core and sites. */
const shared = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
    ],
    'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
}

const bannedImports = [
  { name: 'framer-motion', message: 'Use `motion/react` (Motion v12+), or @dss/motion presets.' },
  { name: 'gsap', message: 'GSAP is excluded (license). Use @dss/motion (Motion + CSS scroll timelines).' },
]
const threePatterns = [
  {
    group: ['three', 'three/*', '@react-three/*'],
    message: 'three.js only in components/3d/** (lazy, client-only). Render it through <Scene> from @dss/three.',
  },
]

/** Site-only rules: thin routes, copy in content/, tokens instead of raw colors. */
const siteRules = [
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@next/next/no-img-element': 'error',
      'no-restricted-imports': ['error', { paths: bannedImports, patterns: threePatterns }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?([0-9a-fA-F]{2})?$/]',
          message: 'Raw hex color: use a DNA token (bg-surface, text-ink, ...) from app/theme.css.',
        },
        {
          selector: "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression",
          message: 'Inline style object: use Tailwind token classes. CSS variables only via a reasoned disable.',
        },
      ],
    },
  },
  {
    files: ['components/3d/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { paths: bannedImports }] },
  },
  {
    files: ['app/**/*.tsx', 'components/sections/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXText[value=/[A-Za-z]{2,}/]',
          message: 'Hard-coded copy: put text in content/<page>.ts and pass it as props.',
        },
        {
          selector: 'Literal[value=/#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?([0-9a-fA-F]{2})?$/]',
          message: 'Raw hex color: use a DNA token from app/theme.css.',
        },
        {
          selector: "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression",
          message: 'Inline style object: use Tailwind token classes.',
        },
      ],
    },
  },
]

/**
 * @param {{ kind?: 'core' | 'site', ignores?: string[] }} [options]
 * @returns {Promise<import('eslint').Linter.Config[]>}
 */
export async function dssEslint({ kind = 'site', ignores = [] } = {}) {
  const ignoreBlock = { ignores: [...IGNORES, ...ignores] }
  if (kind === 'core') {
    return /** @type {import('eslint').Linter.Config[]} */ ([
      ignoreBlock,
      js.configs.recommended,
      ...tseslint.configs.recommended,
      shared,
      { files: ['cli/**/*.ts', 'scripts/**/*.{js,mjs,ts}'], rules: { 'no-console': 'off' } },
    ])
  }
  const { default: vitals } = await import('eslint-config-next/core-web-vitals')
  const { default: nextTs } = await import('eslint-config-next/typescript')
  return [ignoreBlock, ...vitals, ...nextTs, shared, ...siteRules]
}

export default dssEslint
