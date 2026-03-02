import { withModernConfig } from '@modern-js/adapter-rstest';
import { defineConfig } from '@rstest/core';

// Docs: https://rstest.rs/config/
export default defineConfig({
  name: 'basic-app-rstest-browser',
  extends: withModernConfig({
    cwd: __dirname,
  }),
  browser: {
    enabled: true,
    provider: 'playwright',
  },
  setupFiles: ['./tests/rstest.setup.ts'],
});
