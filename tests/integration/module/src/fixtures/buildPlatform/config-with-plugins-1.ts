import { defineConfig } from '@modern-js/module-tools/defineConfig';
import { plugin5 } from './plugin-5';
import { plugin6 } from './plugin-6';

export default defineConfig({
  plugins: [plugin5(), plugin6()],
});
