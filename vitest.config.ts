import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['packages/**/*.test.{ts,tsx}', 'modules/**/*.test.{ts,tsx}', 'cli/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
