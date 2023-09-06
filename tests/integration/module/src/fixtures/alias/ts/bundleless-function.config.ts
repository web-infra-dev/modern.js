import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    alias: config => {
      return {
        ...config,
        '@src': './src',
      };
    },
    buildType: 'bundleless',
    outDir: './dist/bundleless/function',
  },
});
