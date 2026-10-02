import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  tools: {
    dev: { port: 7777, hmr: true },
  },
  plugins: [appTools()],
});
