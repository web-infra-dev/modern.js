import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      bundleOptions: {
        entry: ['./src/index.ts'],
        minify: false,
      },
      path: './dist/false',
    },
    {
      buildType: 'bundle',
      bundleOptions: {
        entry: ['./src/index.ts'],
        minify: 'esbuild',
      },
      path: './dist/esbuild',
    },
    {
      buildType: 'bundle',
      bundleOptions: {
        entry: ['./src/index.ts'],
        minify: 'terser',
      },
      path: './dist/terser',
    },
  ],
});
