import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  tools: {
    postcss(_, { addPlugins }) {
      addPlugins([require('postcss-alias')]);
    },
  },
});
