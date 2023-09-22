import { defineConfig } from '@modern-js/module-tools/defineConfig';
import { plugin1 } from './plugin-1';

export default defineConfig({
  plugins: [plugin1()],
});
