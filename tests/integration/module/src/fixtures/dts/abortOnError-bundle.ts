// import path from 'path';
import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    input: ['src-error/index.ts'],
    dts: {
      abortOnError: false,
      tsconfigPath: './tsconfig-error.json',
    },
    outDir: './dist/bundle-abort-on-error',
  },
});
