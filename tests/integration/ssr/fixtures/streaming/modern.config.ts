import { appTools, defineConfig } from '@modern-js/app-tools';

const bundler = process.env.BUNDLER;

export default defineConfig({
  runtime: {
    router: true,
  },
  server: {
    ssr: {
      mode: 'stream',
    },
  },
  plugins: [
    appTools({
      bundler: bundler === 'rspack' ? 'experimental-rspack' : 'webpack',
    }),
  ],
});
