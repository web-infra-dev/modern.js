import { defineConfig } from '@modern-js/self';

export default defineConfig({
  tools: {
    postcss(_, { addPlugins }) {
      addPlugins([require('postcss-alias')]);
    },
  },
});
