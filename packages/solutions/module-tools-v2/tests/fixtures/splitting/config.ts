import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    bundleOptions: {
      entry: ['./src/index.ts'],
      splitting: true,
    },
    path: './dist',
  },
});
