import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  dev: { port: 8080, hmr: true },
  plugins: [appTools()],
});
