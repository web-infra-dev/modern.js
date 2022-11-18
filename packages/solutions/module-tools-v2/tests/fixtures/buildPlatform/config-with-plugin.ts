import { defineConfig } from '@modern-js/self';
import Plugin1 from './plugin-1';

export default defineConfig({
  plugins: [Plugin1()],
});
