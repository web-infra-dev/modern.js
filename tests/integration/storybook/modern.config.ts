import path from 'path';
import { defineConfig } from '@modern-js/storybook';

export default defineConfig({
  output: {},
  source: {
    alias: {
      react: path.dirname(require.resolve('react/package.json')),
      'react-dom': path.dirname(require.resolve('react-dom/package.json')),
    },
  },
});
