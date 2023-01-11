import { defineConfig } from '@modern-js/self/defineConfig';
import devPlugin1 from './plugin-1';

export default defineConfig({
  plugins: [devPlugin1()],
});
