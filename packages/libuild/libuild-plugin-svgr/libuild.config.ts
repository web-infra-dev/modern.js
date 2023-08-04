import { defineConfig } from '@modern-js/libuild';

export default defineConfig([
  {
    outdir: 'dist/cjs',
    format: 'cjs',
    target: 'node12',
    sourceMap: true,
  },
  {
    outdir: 'dist/esm',
    format: 'esm',
    target: 'es2015',
    sourceMap: true,
  },
]);
