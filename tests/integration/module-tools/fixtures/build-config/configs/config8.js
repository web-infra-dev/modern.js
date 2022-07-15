import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundle',
        format: 'cjs',
        outputPath: 'cjs-sourcemap-true',
        sourceMap: true,
      },
      {
        buildType: 'bundle',
        format: 'cjs',
        outputPath: 'cjs-sourcemap-external',
        sourceMap: 'external',
      },
      {
        buildType: 'bundle',
        format: 'cjs',
        outputPath: 'cjs-sourcemap-inline',
        sourceMap: 'inline',
      },
      {
        buildType: 'bundle',
        format: 'cjs',
        outputPath: 'cjs-sourcemap-false',
        sourceMap: false,
      },
    ],
  },
});
