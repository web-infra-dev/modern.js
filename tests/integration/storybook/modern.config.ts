import path from 'path';
import { defineConfig } from '@modern-js/storybook';
// import { builderPluginSwc } from '@modern-js/builder-plugin-swc';

export default defineConfig({
  output: {},
  source: {
    alias: {
      react: path.dirname(require.resolve('react/package.json')),
      'react-dom': path.dirname(require.resolve('react-dom/package.json')),
    },
  },
  // builderPlugins: [builderPluginSwc()],
});
