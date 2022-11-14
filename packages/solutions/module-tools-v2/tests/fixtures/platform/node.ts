import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    bundleOptions: {
      entry: ['./src/index.ts'],
      platform: 'node',
    },
    path: './dist/node',
  },
});
