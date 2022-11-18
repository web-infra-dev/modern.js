import { defineConfig } from '../../utils';

export default defineConfig({
  source: {
    alias: {
      '@src2': './src2',
    },
  },
  buildConfig: {
    buildType: 'bundleless',
    bundlelessOptions: {
      sourceDir: './src2',
    },
    dts: {
      tsconfigPath: './tsconfig-bundleless.json',
    },
    path: './dist/tsconfig-path/bundleless',
  },
});
