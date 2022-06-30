import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
        format: 'cjs',
        outputPath: 'cjs',
      },
      {
        buildType: 'bundleless',
        format: 'esm',
        outputPath: 'esm',
      },
      {
        buildType: 'bundleless',
        format: 'umd',
        outputPath: 'umd',
      },
    ],
  },
});
