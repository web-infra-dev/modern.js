import { appTools, defineConfig } from '@modern-js/app-tools';
import { ssgPlugin } from '@modern-js/plugin-ssg';

// output 值是数组字面量（非对象字面量），不能下钻当 output 对象
export default defineConfig({
  output: [{ ssg: false }],
  plugins: [appTools(), ssgPlugin()],
});
