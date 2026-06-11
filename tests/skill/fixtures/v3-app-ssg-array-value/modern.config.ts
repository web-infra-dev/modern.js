import { appTools, defineConfig } from '@modern-js/app-tools';
import { ssgPlugin } from '@modern-js/plugin-ssg';

// output.ssg 类型是 boolean | object，数组是非法值——既不算已启用，也不静默改写
export default defineConfig({
  output: { ssg: [] },
  plugins: [appTools(), ssgPlugin()],
});
