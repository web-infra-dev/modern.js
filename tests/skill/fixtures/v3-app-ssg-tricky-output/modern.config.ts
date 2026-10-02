import { appTools, defineConfig } from '@modern-js/app-tools';
import { ssgPlugin } from '@modern-js/plugin-ssg';

export default defineConfig({
  output: {
    note: "ssg: false in a string",
    // ssg: false in a comment
    experimental: { ssg: false },
    ssg: false,
  },
  plugins: [appTools(), ssgPlugin()],
});
