import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      input: { bundle: './src/index.ts' },
      autoExtension: true,
      format: 'cjs',
      sourceMap: true,
      outDir: 'dist/cjs',
    },
    {
      buildType: 'bundleless',
      autoExtension: true,
      format: 'cjs',
      sourceMap: true,
      outDir: 'dist/cjs',
    },
    {
      buildType: 'bundleless',
      autoExtension: true,
      format: 'esm',
      sourceMap: true,
      outDir: 'dist/esm',
    },
  ],
});
