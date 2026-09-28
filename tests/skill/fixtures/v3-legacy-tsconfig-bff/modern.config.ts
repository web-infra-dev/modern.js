import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';

export default defineConfig({
  plugins: [appTools(), bffPlugin()],
});
