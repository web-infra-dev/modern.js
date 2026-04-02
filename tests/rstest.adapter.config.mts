import { defineConfig } from '@rstest/core';

export default defineConfig({
  projects: [
    'integration/rstest/**/rstest.config.{ts,mts}',
    'integration/rstest/**/rstest.*.config.{ts,mts}',
  ],
  reporters: ['default'],
});
