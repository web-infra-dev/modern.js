import appTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    mainEntryName: 'index',
  },
  html: {
    titleByEntries: {
      index: 'TikTok',
    },
  },
  plugins: [appTools()],
});
