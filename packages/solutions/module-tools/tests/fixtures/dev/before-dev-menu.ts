import { defineConfig } from '@modern-js/self/defineConfig';
import devPlugin3 from './plugin-1';

export default defineConfig({
  plugins: [devPlugin3()],
});
