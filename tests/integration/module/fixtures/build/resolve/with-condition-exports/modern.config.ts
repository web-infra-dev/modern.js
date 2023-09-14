import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      platform: 'browser',
      input: ['entry*.ts'],
      outDir: 'dist/browser',
      format: 'esm',
    },
  ],
});
