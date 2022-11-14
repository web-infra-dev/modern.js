import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'umd',
      bundleOptions: {
        umdModuleName: () => 'Demo',
      },
      path: './dist',
    },
  ],
});
