import { appTools, defineConfig } from '@modern-js/app-tools';
import { statePlugin } from '@modern-js/plugin-state';
export default defineConfig({
  runtime: {
    router: true,
    state: true,
  },
  plugins: [appTools(), statePlugin()],
});
