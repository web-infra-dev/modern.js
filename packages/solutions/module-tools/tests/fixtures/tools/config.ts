import { defineConfig } from '@modern-js/self/defineConfig';

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
