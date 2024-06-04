import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {
    router: true,
  },
  plugins: [
    AppToolsPlugin({
      bundler: 'experimental-rspack',
    }),
  ],
});
