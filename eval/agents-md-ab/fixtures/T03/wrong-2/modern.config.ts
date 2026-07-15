import { appTools, defineConfig } from '@modern-js/app-tools';

// WRONG: ssr explicitly disabled
export default defineConfig({
  plugins: [appTools()],
  server: {
    ssr: false,
  },
});
