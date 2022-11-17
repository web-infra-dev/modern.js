import { defineConfig } from '../../utils';

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
