import { defineConfig } from '@playwright/test';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  use: {
    // Use the built-in Chrome browser to speed up CI tests
    channel: isCI ? 'chrome' : undefined,
  },
});
