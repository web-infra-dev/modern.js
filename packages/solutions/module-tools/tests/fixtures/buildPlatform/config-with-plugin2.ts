import { defineConfig } from '@modern-js/self/defineConfig';
import plugin2 from './plugin-2';

export default defineConfig({
  plugins: [plugin2()],
});
