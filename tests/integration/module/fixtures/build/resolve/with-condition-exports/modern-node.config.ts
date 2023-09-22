import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      platform: 'node',
      input: ['entry*.ts'],
      outDir: 'dist/node',
    },
  ],
});
