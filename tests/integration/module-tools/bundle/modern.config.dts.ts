import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      buildType: 'bundle',
      bundleOptions: {
        entry: {
          index: './dts/index.ts',
        },
      },
      outputPath: './dts',
    },
  },
});
