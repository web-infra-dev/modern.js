import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
        target: 'es5',
        outputPath: 'es5',
      },
      {
        buildType: 'bundleless',
        target: 'es6',
        outputPath: 'es6',
      },
      {
        buildType: 'bundleless',
        target: 'es2015',
        outputPath: 'es2015',
      },
    ],
  },
});
