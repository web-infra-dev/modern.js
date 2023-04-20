import appTools, { defineConfig } from '@modern-js/app-tools';

const BUNDLER = process.env.BUNDLER || 'webpack';

export default defineConfig({
  output: {
    assetPrefix: 'https://demo.com/',
    distPath: {
      root: BUNDLER === 'rspack' ? 'dist/rspack' : 'dist/webpack',
    },
  },

  plugins: [
    appTools({
      bundler: BUNDLER === 'rspack' ? 'experimental-rspack' : 'webpack',
    }),
  ],
});
