import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tsconfigPaths()],
    test: {
      globals: true,
      // Component tests use jsdom; integration tests override with @vitest-environment node
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      // Exclude Playwright E2E tests
      exclude: ['**/node_modules/**', '**/e2e/**'],
      env: {
        // Point all tests at the test database so integration tests never touch production data
        DATABASE_URL: env['DATABASE_TEST_URL'] ?? env['DATABASE_URL'] ?? '',
        NODE_ENV: 'test',
        SKIP_ENV_VALIDATION: '1',
      },
      // Run integration tests sequentially to prevent parallel DB access conflicts
      maxWorkers: 1,
      minWorkers: 1,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        exclude: ['**/node_modules/**', '**/e2e/**', 'src/test/**'],
      },
    },
  }
})
