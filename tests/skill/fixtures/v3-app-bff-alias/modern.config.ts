import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin as bff } from '@modern-js/plugin-bff';

export default defineConfig({
  plugins: [appTools(), bff()],
});
