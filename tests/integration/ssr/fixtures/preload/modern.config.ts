import { appTools, defineConfig } from '@modern-js/app-tools';

const bundler = process.env.BUNDLER;

export default defineConfig({
  server: {
    ssr: {
      preload: true,
    },
  },
  runtime: {
    router: true,
  },
  plugins: [
    appTools({
      bundler: bundler === 'rspack' ? 'experimental-rspack' : 'webpack',
    }),
  ],
});
