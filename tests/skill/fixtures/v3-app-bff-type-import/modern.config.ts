import { appTools, defineConfig } from '@modern-js/app-tools';
import type { BffConfig } from '@modern-js/plugin-bff';

const _t: BffConfig | undefined = undefined;

export default defineConfig({
  plugins: [appTools()],
});
