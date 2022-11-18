import { defineConfig } from '@modern-js/self';
import DevPlugin1 from './plugin-1';
import DevPlugin2 from './plugin-2';

export default defineConfig({
  plugins: [DevPlugin1(), DevPlugin2()],
});
