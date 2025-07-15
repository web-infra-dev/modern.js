import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    enableCustomEntry: true,
  },
  runtime: {
    router: true,
  },
  plugins: [
    appTools({
      bundler: 'rspack',
    }),
  ],
});
