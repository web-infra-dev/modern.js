import appTools, { defineConfig } from '@modern-js/app-tools';
import { swcPlugin } from '@modern-js/plugin-swc';

export default defineConfig({
  tools: {
    swc: {
      jsc: {
        transform: {
          /** ts cant use new decorator */
          legacyDecorator: false,
        },
      },
    },
  },
  output: {
    disableMinimize: true,
  },
  plugins: [appTools(), swcPlugin()],
});
