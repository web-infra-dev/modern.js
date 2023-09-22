import { defineConfig } from '@modern-js/module-tools/defineConfig';
import { plugin2 } from './plugin-2';

export default defineConfig({
  plugins: [plugin2()],
});
