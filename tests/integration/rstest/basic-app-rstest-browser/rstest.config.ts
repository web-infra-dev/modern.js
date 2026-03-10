import { withModernConfig } from '@modern-js/adapter-rstest';
import { defineConfig } from '@rstest/core';

// Docs: https://rstest.rs/config/
export default defineConfig({
  name: 'basic-app-rstest-browser',
  extends: withModernConfig({
    cwd: __dirname,
  }),
  // Add setupFiles when you need global browser test setup, such as
  // custom matchers, mocks, or polyfills.
  // Docs: https://rstest.rs/config/
  // setupFiles: ['./tests/rstest.setup.ts'],
  browser: {
    enabled: true,
    provider: 'playwright',
  },
});
