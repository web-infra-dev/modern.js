import appTools, { defineConfig } from '@modern-js/app-tools';
import { swcPlugin } from '@modern-js/plugin-swc';

export default defineConfig({
  source: {
    decorators: {
      version: '2022-03',
    },
  },
  output: {
    disableMinimize: true,
  },
  plugins: [appTools(), swcPlugin()],
});
