import { appTools, defineConfig } from '@modern-js/app-tools';

// legacy example: dev: { port: 7777 }
export default defineConfig({
  dev: { port: 8080 },
  runtime: {
    router: true,
  },
  plugins: [appTools({ bundler: 'rspack' })],
});
