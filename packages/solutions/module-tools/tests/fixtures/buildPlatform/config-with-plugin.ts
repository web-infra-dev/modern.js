import { defineConfig } from '@modern-js/self/defineConfig';
import plugin1 from './plugin-1';

export default defineConfig({
  plugins: [plugin1()],
});
