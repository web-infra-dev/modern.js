import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundle',
        format: 'cjs',
        outputPath: 'cjs',
      },
      {
        buildType: 'bundle',
        format: 'esm',
        outputPath: 'esm',
      },
      {
        buildType: 'bundle',
        format: 'umd',
        outputPath: 'umd',
      },
    ],
  },
});
