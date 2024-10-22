import { appTools, defineConfig } from '@modern-js/app-tools';
import { swcPlugin } from '@modern-js/plugin-swc';

export default defineConfig({
  tools: {
    swc: (config, { setConfig }) => {
      setConfig(config, 'cssMinify', false);
      return config;
    },
  },
  output: {
    disableTsChecker: true,
  },
  source: {
    entries: {
      index: './src/index.js',
    },
  },
  plugins: [appTools(), swcPlugin()],
});
