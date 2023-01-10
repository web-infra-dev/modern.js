import appTools, { defineConfig } from '@modern-js/app-tools';
import ssgPlugin from '@modern-js/plugin-ssg';

export default defineConfig({
  output: {
    ssg: true,
  },
  plugins: [appTools(), ssgPlugin()],
});
