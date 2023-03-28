// import path from 'path';
import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    sourceDir: 'src-error',
    dts: {
      catchError: true,
      tsconfigPath: './tsconfig-error.json',
    },
    outDir: './dist/bundleless-catch-error',
  },
});
