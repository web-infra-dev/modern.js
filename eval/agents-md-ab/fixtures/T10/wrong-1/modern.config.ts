import { appTools, defineConfig } from '@modern-js/app-tools';

// WRONG: title typo ("Eval app")
export default defineConfig({
  plugins: [appTools()],
  html: {
    title: 'Eval app',
    meta: {
      description: 'eval description',
    },
  },
});
