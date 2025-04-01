import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: true,
  plugins: [
    appTools({
      bundler: process.env.BUNDLER === 'webpack' ? 'webpack' : 'rspack',
    }),
  ],
});
