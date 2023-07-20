import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  tools: {
    htmlPlugin: false,
  },
  output: {
    polyfill: 'off',
    disableTsChecker: true,
  },
  plugins: [appTools()],
});
