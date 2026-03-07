import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      'tests/e2e/**', // Exclude E2E tests from Vitest
      'node_modules/**', // Exclude node modules
    ],
  },
});
