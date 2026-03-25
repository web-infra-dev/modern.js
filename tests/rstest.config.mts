import { defineConfig } from '@rstest/core';

export default defineConfig({
  projects: [
    'integration/**/rstest.config.{ts,mts}',
    'integration/**/rstest.*.config.{ts,mts}',
  ],
});
