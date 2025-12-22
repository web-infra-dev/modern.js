import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    disableDefaultEntries: true,
    entries: {
      index: 'src/app-custom-entries/App.tsx',
      'entry-1': {
        entry: 'src/entry-1/App.tsx',
        customEntry: true,
      },
      'entry-2': {
        entry: 'src/entry-2/routes',
        customEntry: true,
      },
    },
  },
  server: {
    ssr: {
      mode: 'string',
    },
  },
  plugins: [appTools()],
});
