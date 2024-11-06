import { appTools, defineConfig } from '@modern-js/app-tools/v3';

export default defineConfig({
  runtime: {
    router: true,
  },
  plugins: [
    appTools({
      bundler: process.env.BUNDLER === 'webpack' ? 'webpack' : 'rspack',
    }),
  ],
});
