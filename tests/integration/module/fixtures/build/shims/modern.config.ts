import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      shims: true,
      input: { bundle: './src/index.ts' },
      format: 'esm',
      outDir: 'dist/esm',
    },
    {
      buildType: 'bundle',
      input: { bundle: './src/index.ts' },
      shims: true,
      format: 'cjs',
      outDir: 'dist/cjs',
    },
    {
      buildType: 'bundleless',
      shims: true,
      format: 'esm',
      outDir: 'dist/esm',
    },
    {
      buildType: 'bundleless',
      shims: true,
      format: 'cjs',
      outDir: 'dist/cjs',
    },
  ],
});
