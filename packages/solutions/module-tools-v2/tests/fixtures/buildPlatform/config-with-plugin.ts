import { defineConfig } from '@modern-js/self/defineConfig';
import Plugin1 from './plugin-1';

export default defineConfig({
  plugins: [Plugin1()],
});
