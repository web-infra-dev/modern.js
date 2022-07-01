import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
        format: 'cjs',
        outputPath: 'cjs-sourcemap-true',
        sourceMap: true,
      },
      {
        buildType: 'bundleless',
        format: 'cjs',
        outputPath: 'cjs-sourcemap-external',
        sourceMap: 'external',
      },
      {
        buildType: 'bundleless',
        format: 'cjs',
        outputPath: 'cjs-sourcemap-inline',
        sourceMap: 'inline',
      },
      {
        buildType: 'bundleless',
        format: 'cjs',
        outputPath: 'cjs-sourcemap-false',
        sourceMap: false,
      },
    ],
  },
});
