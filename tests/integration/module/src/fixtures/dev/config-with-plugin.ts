import { defineConfig } from '@modern-js/module-tools/defineConfig';
import { devPlugin1 } from './plugin-1';

export default defineConfig({
  plugins: [devPlugin1()],
});
