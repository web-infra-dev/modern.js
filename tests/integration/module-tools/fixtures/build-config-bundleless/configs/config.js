import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
        bundlelessOptions: {
          sourceDir: './src',
        },
        outputPath: '0',
      },
      {
        buildType: 'bundleless',
        bundlelessOptions: {
          sourceDir: './src1',
        },
        outputPath: '1',
      },
    ],
  },
});
