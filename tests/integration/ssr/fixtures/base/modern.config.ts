import appTools, { defineConfig } from '@modern-js/app-tools';

const bundler = process.env.BUNDLER;

export default defineConfig({
  runtime: {
    router: true,
  },
  server: {
    ssr: true,
  },
  tools: {
    webpack(config) {
      config.output!.chunkLoadingGlobal = 'hello xxx';
    },
  },
  plugins: [
    appTools({
      bundler: bundler === 'rspack' ? 'experimental-rspack' : 'webpack',
    }),
  ],
});
