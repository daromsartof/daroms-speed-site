import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'server-only': fileURLToPath(new URL('./packages/config/vitest/empty.ts', import.meta.url)),
    },
  },
  test: {
    include: ['packages/**/*.test.{ts,tsx}', 'modules/**/*.test.{ts,tsx}', 'cli/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
