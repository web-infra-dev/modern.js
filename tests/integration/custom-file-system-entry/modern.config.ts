import { appTools, defineConfig } from '@modern-js/app-tools';

const bundler = process.env.BUNDLER;

export default defineConfig({
  source: {
    entries: {
      custom: 'src/custom',
    },
    disableDefaultEntries: true,
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
