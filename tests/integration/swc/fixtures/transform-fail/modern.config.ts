import { appTools, defineConfig } from '@modern-js/app-tools';
import { swcPlugin } from '@modern-js/plugin-swc';

export default defineConfig({
  runtime: true,
  tools: {
    swc: {},
  },
  output: {
    disableTsChecker: true,
  },
  plugins: [appTools(), swcPlugin()],
});
