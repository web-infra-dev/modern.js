import appTools, { defineConfig } from '@modern-js/app-tools';
import ssgPlugin from '@modern-js/plugin-ssg';
import serverPlugin from '@modern-js/plugin-server';

export default defineConfig({
  output: {
    ssg: true,
  },
  plugins: [appTools(), ssgPlugin(), serverPlugin()],
});
