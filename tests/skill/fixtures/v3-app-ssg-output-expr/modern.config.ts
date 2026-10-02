import { appTools, defineConfig } from '@modern-js/app-tools';
import { ssgPlugin } from '@modern-js/plugin-ssg';

// output 是动态表达式（函数调用），不是对象字面量
const makeOutput = (o: Record<string, unknown>) => o;

export default defineConfig({
  output: makeOutput({ ssg: false }),
  plugins: [appTools(), ssgPlugin()],
});
