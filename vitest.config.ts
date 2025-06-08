import { createFoundryTestConfig } from '@rayners/foundry-dev-tools/vitest';

export default createFoundryTestConfig({
  test: {
    setupFiles: ['@rayners/foundry-test-utils/helpers/setup.ts'],
    coverage: {
      thresholds: {
        global: {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75
        }
      }
    }
  }
});