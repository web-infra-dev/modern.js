import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      bundleOptions: {
        entry: ['./src/index.ts'],
        externals: ['react'],
      },
      path: './dist/string',
    },
    {
      buildType: 'bundle',
      bundleOptions: {
        entry: ['./src/index.ts'],
        externals: [/react/],
      },
      path: './dist/regexp',
    },
  ],
});
