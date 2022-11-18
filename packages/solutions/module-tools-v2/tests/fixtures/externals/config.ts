import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      externals: ['react'],

      outdir: './dist/string',
    },
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      externals: [/react/],

      outdir: './dist/regexp',
    },
  ],
});
