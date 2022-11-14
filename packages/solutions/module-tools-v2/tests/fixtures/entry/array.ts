import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    bundleOptions: {
      entry: ['./src/index.ts', './src/browser.ts'],
    },
    path: './dist/array',
  },
});
