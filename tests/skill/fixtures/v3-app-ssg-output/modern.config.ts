import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: { polyfill: 'usage' },
  plugins: [appTools()],
});
