import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    alias: {
      '@src2': './src2',
    },
    buildType: 'bundleless',
    sourceDir: './src2',
    dts: {
      tsconfigPath: './tsconfig-bundleless.json',
    },
    outDir: './dist/tsconfig-path/bundleless',
  },
});
