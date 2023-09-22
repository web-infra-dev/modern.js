import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      input: ['entry1.ts'],
      resolve: {
        mainFields: ['source', 'module', 'main'],
      },
    },
    {
      buildType: 'bundle',
      input: ['entry2.ts'],
      platform: 'node',
      outDir: 'dist/node',
    },
    {
      buildType: 'bundle',
      input: ['entry2.ts'],
      platform: 'browser',
      outDir: 'dist/browser',
      format: 'esm',
    },
  ],
});
