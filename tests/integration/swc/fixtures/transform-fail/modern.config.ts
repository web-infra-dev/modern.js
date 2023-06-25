import { appTools, defineConfig } from '@modern-js/app-tools';
import { swcPlugin } from '@modern-js/plugin-swc';

export default defineConfig({
  tools: {
    swc: {},
  },
  plugins: [appTools(), swcPlugin()],
});
