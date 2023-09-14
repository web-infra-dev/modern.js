import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    alias: {
      '@src1': './src1',
    },
    buildType: 'bundle',
    input: ['./src1/index.ts'],
    tsconfig: './tsconfig-bundle.json',
    outDir: './dist/tsconfig-path/bundle',
  },
});
