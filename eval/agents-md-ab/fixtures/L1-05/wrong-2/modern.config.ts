import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools()],
  html: {
    meta: {
      keywords: 'modernjs ab benchmark',
    },
  },
});
