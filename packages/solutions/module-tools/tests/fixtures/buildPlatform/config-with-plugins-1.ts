import { defineConfig } from '@modern-js/self/defineConfig';
import plugin5 from './plugin-5';
import plugin6 from './plugin-6';

export default defineConfig({
  plugins: [plugin5(), plugin6()],
});
