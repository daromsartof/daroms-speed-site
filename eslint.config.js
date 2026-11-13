import { dssEslint } from '@dss/config/eslint'

export default dssEslint({
  kind: 'core',
  ignores: [
    'template/**',
    'generators/**/files/**',
    'registry/**',
    'modules/*/files/**',
    'docs/**',
    '_ai/**',
  ],
})
