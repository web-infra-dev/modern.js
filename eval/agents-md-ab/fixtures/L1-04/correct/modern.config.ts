import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools()],
  html: {
    title: 'AB Demo Title',
  },
});
