import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      minify: false,

      outdir: './dist/false',
    },
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      minify: 'esbuild',

      outdir: './dist/esbuild',
    },
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      minify: 'terser',

      outdir: './dist/terser',
    },
  ],
});
