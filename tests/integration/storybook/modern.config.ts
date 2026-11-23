import path from 'node:path';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';

export default defineConfig({
  source: { alias: { '@components': path.resolve(__dirname, 'src') } },
  plugins: [appTools(), bffPlugin()],
});
