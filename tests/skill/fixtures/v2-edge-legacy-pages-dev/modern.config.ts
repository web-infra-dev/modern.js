import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  bff: {
    prefix: '/api',
  },
  dev: {
    port: 3000,
  },
  html: {
    title: 'fixture',
  },
  plugins: [appTools({ bundler: 'rspack' })],
});
