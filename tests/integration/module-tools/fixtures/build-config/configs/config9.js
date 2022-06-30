import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundle',
        enableDts: true,
        outputPath: 'bundle-enable-dts',
      },
      {
        buildType: 'bundleless',
        enableDts: true,
        outputPath: 'bundleless-enable-dts',
      },
      {
        buildType: 'bundle',
        enableDts: true,
        dtsOnly: true,
        outputPath: 'bundle-dtsonly-enable-dts',
      },
      {
        buildType: 'bundleless',
        enableDts: true,
        dtsOnly: true,
        outputPath: 'bundleless-dtsonly-enable-dts',
      },
      {
        buildType: 'bundle',
        enableDts: false,
        dtsOnly: true,
        outputPath: 'bundle-dtsonly',
      },
      {
        buildType: 'bundleless',
        enableDts: false,
        dtsOnly: true,
        outputPath: 'bundleless-dtsonly',
      },
    ],
  },
});
