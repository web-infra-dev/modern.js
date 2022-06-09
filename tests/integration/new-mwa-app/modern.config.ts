import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    enableInlineScripts: true,
  },
  runtime: {
    router: true,
    state: true,
  },
  tools: {
    postcss(config, { addPlugins }) {
      addPlugins({ postcssPlugin: 'foo' });
    },
  },
});
