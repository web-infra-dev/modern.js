import { defineConfig } from '../../utils';

export default defineConfig({
  tools: {
    postcss(_, { addPlugins }) {
      addPlugins([require('postcss-alias')]);
    },
  },
});
