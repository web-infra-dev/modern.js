import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools()],
  html: {
    meta: {
      description: 'modern js ab benchmark',
    },
  },
});
