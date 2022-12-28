import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      minify: false,

      outDir: './dist/false',
    },
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      minify: 'esbuild',

      outDir: './dist/esbuild',
    },
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      minify: 'terser',

      outDir: './dist/terser',
    },
  ],
});
