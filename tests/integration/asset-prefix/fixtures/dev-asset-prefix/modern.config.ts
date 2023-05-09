import appTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  dev: {
    assetPrefix: true,
  },
  output: {
    polyfill: 'off',
  },
  plugins: [appTools()],
});
