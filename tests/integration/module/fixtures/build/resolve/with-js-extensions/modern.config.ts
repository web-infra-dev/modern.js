import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      input: ['index.ts'],
      resolve: {
        jsExtensions: ['.mts', '.ts'],
      },
    },
  ],
});
