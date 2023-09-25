// import path from 'path';
import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    input: ['src-error/index.ts'],
    tsconfig: './tsconfig-error.json',
    dts: {
      abortOnError: false,
    },
    outDir: './dist/bundle-abort-on-error',
  },
});
