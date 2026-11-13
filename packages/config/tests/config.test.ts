import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8')) as unknown

describe('@dss/config', () => {
  it('keeps the root Prettier config identical to the shared one', () => {
    expect(read('../../../.prettierrc.json')).toEqual(read('../prettier.json'))
  })

  it('enforces the type-stripping-safe compiler flags', () => {
    const base = read('../tsconfig.base.json') as { compilerOptions: Record<string, unknown> }
    expect(base.compilerOptions).toMatchObject({
      strict: true,
      erasableSyntaxOnly: true,
      verbatimModuleSyntax: true,
      allowImportingTsExtensions: true,
      noUncheckedIndexedAccess: true,
    })
  })
})
