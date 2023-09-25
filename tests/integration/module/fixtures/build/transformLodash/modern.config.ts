import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      input: ['./src/a.js'],
      transformLodash: false,
      target: 'esnext',
      format: 'esm',
      buildType: 'bundleless',
      outDir: './dist/esm',
    },
    {
      input: ['./src/a.js'],
      transformLodash: false,
      target: 'esnext',
      format: 'cjs',
      buildType: 'bundleless',
      outDir: './dist/cjs',
    },
    {
      input: ['./src/b.js'],
      transformLodash: true,
      target: 'esnext',
      format: 'esm',
      buildType: 'bundleless',
      outDir: './dist/esm',
    },
    {
      input: ['./src/b.js'],
      transformLodash: true,
      target: 'esnext',
      format: 'cjs',
      buildType: 'bundleless',
      outDir: './dist/cjs',
    },
  ],
});
