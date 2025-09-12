import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    disableDefaultEntries: true,
    entries: {
      main: 'src/app-custom-entries/App.tsx',
      'entry-1': {
        entry: 'src/entry-1/App.tsx',
        customEntry: true,
      },
    },
  },
  server: {
    ssr: true,
  },
  plugins: [
    appTools({
      bundler: process.env.BUNDLER === 'webpack' ? 'webpack' : 'rspack',
    }),
  ],
});
