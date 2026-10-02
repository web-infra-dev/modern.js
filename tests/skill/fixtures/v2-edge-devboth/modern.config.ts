import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  dev: { client: { port: 8081 }, port: 8080 },
  plugins: [appTools()],
});
