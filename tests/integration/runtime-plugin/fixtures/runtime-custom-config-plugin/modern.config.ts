import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
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
