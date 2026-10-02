import { appTools, defineConfig } from '@modern-js/app-tools';
import { withZephyr } from 'zephyr-modernjs-plugin';

export default defineConfig({
  output: {
    distPath: {
      html: './',
    },
  },
  html: { outputStructure: 'flat' },
  source: { mainEntryName: 'index' },
  plugins: [appTools(), withZephyr()],
});
