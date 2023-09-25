// import path from 'path';
import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    sourceDir: 'src-error',
    tsconfig: './tsconfig-error.json',
    dts: {
      abortOnError: false,
    },
    outDir: './dist/bundleless-abort-on-error',
  },
});
