// import path from 'path';
import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    resolve: {
      alias: {
        react: 'react-native',
      },
    },
    outDir: './dist/object',
    buildType: 'bundleless',
    alias: {
      react: 'react-native',
    },
  },
});
