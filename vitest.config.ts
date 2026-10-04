// Vitest config — intentionally free of `vitest/config` import so that
// `npx vitest run` works even when vitest is resolved from the npx cache
// (test deps are installed with `npm install --no-save`, package.json untouched).
import path from 'node:path';

export default {
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    testTimeout: 15000,
  },
};
