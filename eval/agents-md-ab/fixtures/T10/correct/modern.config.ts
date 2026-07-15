import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools()],
  html: {
    title: 'Eval App',
    meta: {
      description: 'eval description',
    },
  },
});
