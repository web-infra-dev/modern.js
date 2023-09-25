import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    style: {
      less: {
        lessOptions: {
          math: 'always',
        },
        additionalData: '@base-color: #c6538c;',
      },
    },
    alias: {
      '~': require('path').resolve(__dirname, 'nest'),
    },
    input: ['index.less'],
    outDir: 'dist/options',
  },
});
