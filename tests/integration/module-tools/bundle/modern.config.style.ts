import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      buildType: 'bundle',
      bundleOptions: {
        entry: {
          index: './style/index.js',
        },
      },
      outputPath: './style',
    },
  },
});
