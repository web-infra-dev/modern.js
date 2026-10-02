import { appTools, defineConfig } from '@modern-js/app-tools';
import { other } from '@modern-js/plugin-bff';

export default defineConfig({
  plugins: [appTools(), bffPlugin()],
});
