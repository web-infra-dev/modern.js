import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    bundleOptions: {
      entry: {
        main: './src/index.ts',
      },
    },
    path: './dist/object',
  },
});
