import appTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    distPath: {
      root: 'dist/foo',
    },
  },
  plugins: [appTools()],
});
