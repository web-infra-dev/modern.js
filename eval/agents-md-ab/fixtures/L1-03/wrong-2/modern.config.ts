import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools()],
  output: {
    distPath: {
      root: 'build',
      js: 'js',
    },
  },
});
