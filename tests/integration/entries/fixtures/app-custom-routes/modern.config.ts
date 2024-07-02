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
      bundler:
        process.env.BUNDLER === 'webpack' ? 'webpack' : 'experimental-rspack',
    }),
  ],
});
