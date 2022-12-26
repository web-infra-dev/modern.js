import { defineConfig } from '@modern-js/self/defineConfig';

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
    outDir: './dist/tsconfig-path/bundle',
  },
});
