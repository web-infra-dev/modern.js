// import path from 'path';
import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    input: ['src-error/index.ts'],
    dts: {
      abortOnError: true,
      tsconfigPath: './tsconfig-error.json',
    },
    outDir: './dist/bundle-abort-on-error',
  },
});
