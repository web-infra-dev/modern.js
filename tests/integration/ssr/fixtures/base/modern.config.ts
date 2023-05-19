import appTools, { defineConfig } from '@modern-js/app-tools';

const bundler = process.env.BUNDLER;

export default defineConfig({
  runtime: {
    router: true,
  },
  server: {
    ssr: true,
  },
  security: {
    nonce: 'test-nonce',
  },
  plugins: [
    appTools({
      bundler: bundler === 'rspack' ? 'experimental-rspack' : 'webpack',
    }),
  ],
});
