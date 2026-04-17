import { defineConfig } from '@rstest/core';

export default defineConfig({
  name: 'adapter-test',
  projects: [
    'integration/rstest/**/rstest.config.{ts,mts}',
    'integration/rstest/**/rstest.*.config.{ts,mts}',
  ],
});
