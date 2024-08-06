// import path from 'path';
import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    alias: {
      react: 'react-native',
    },
    buildType: 'bundleless',
  },
});
