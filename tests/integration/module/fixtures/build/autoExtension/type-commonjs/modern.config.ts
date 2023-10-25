import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      autoExtension: true,
      input: { bundle: './src/index.ts' },
      format: 'esm',
    },
    {
      buildType: 'bundleless',
      autoExtension: true,
      format: 'esm',
    },
  ],
});
