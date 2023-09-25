import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    style: {
      sass: {
        sassOptions: {},
        additionalData: '$base-color: #c6538c;',
      },
    },
    asset: {
      limit: 0,
    },
    input: ['index.scss'],
  },
});
