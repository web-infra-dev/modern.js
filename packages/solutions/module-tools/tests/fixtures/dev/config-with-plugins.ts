import { defineConfig } from '@modern-js/self/defineConfig';
import devPlugin1 from './plugin-1';
import devPlugin2 from './plugin-2';

export default defineConfig({
  plugins: [devPlugin1(), devPlugin2()],
});
