import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    alias: config => {
      return {
        ...config,
        '@src': './src',
      };
    },
    outDir: './dist/bundle/function',
    buildType: 'bundle',
  },
});
