import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    alias: {
      '@src1': './src1',
    },
    buildType: 'bundle',
    input: ['./src1/index.ts'],
    dts: {
      tsconfigPath: './tsconfig-bundle.json',
    },
    outdir: './dist/tsconfig-path/bundle',
  },
});
