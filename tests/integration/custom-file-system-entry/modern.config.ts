import { appTools, defineConfig } from '@modern-js/app-tools';

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
      bundler: process.env.BUNDLER === 'webpack' ? 'webpack' : 'rspack',
    }),
  ],
});
