import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: true,
  tools: {
    esbuild: {},
  },
  output: {
    disableTsChecker: true,
  },
  plugins: [appTools()],
});
