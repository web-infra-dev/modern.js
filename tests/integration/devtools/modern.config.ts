import { appTools, defineConfig } from '@modern-js/app-tools';
import { devtoolsPlugin } from '@modern-js/plugin-devtools';

export default defineConfig({
  runtime: {},
  performance: {
    buildCache: false,
  },
  plugins: [appTools(), devtoolsPlugin()],
});
