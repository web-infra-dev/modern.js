import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      externals: ['react'],

      outDir: './dist/string',
    },
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      externals: [/react/],

      outDir: './dist/regexp',
    },
  ],
});
