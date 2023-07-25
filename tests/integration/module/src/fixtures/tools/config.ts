import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    style: {
      postcss(_, { addPlugins }) {
        addPlugins([require('postcss-alias')]);
      },
    },
  },
});
