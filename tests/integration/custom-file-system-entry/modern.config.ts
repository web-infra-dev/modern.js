import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    entries: {
      custom: 'src/custom',
    },
    disableDefaultEntries: true,
  },
  plugins: [appTools()],
  performance: {
    buildCache: false,
  },
});
