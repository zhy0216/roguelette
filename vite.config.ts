/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
})
