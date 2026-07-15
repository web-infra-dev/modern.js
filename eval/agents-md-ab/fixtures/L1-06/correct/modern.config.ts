import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools()],
  resolve: {
    alias: {
      '@common': './src/common',
    },
  },
});
