import { appTools, defineConfig } from '@modern-js/app-tools';
import { ssgPlugin } from '@modern-js/plugin-ssg';

export default defineConfig({
  runtime: {
    router: true,
  },
  output: {
    ssg: true,
  },
  plugins: [appTools(), ssgPlugin()],
});
