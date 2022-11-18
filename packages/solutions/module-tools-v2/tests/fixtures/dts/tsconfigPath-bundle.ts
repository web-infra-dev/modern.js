import { defineConfig } from '../../utils';

export default defineConfig({
  source: {
    alias: {
      '@src1': './src1',
    },
  },
  buildConfig: {
    buildType: 'bundle',
    bundleOptions: {
      entry: ['./src1/index.ts'],
    },
    dts: {
      tsconfigPath: './tsconfig-bundle.json',
    },
    path: './dist/tsconfig-path/bundle',
  },
});
