import { defineConfig } from '@modern-js/self/defineConfig';
import plugin3 from './plugin-3';
import plugin4 from './plugin-4';

export default defineConfig({
  plugins: [plugin3(), plugin4()],
});
