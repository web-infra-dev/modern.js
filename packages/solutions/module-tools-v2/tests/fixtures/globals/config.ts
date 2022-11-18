import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'umd',
      bundleOptions: {
        globals: {
          react: 'React',
        },
      },
      path: './dist/umd',
    },
    {
      buildType: 'bundle',
      format: 'iife',
      bundleOptions: {
        globals: {
          react: 'React',
        },
      },
      path: './dist/iife',
    },
  ],
});
