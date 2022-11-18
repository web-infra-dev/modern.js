import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      bundleOptions: {
        metafile: true,
      },
      path: './dist',
    },
  ],
});
