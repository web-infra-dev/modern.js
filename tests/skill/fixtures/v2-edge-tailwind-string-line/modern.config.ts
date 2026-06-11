import { appTools, defineConfig } from '@modern-js/app-tools';
import { tailwindcssPlugin } from '@modern-js/plugin-tailwindcss';

// 普通字符串行（含示例文本 + 含 , ] / , ) 字面量），不应被 tailwind 移除/逗号清理误改：
export const note = "example text: from '@modern-js/plugin-tailwindcss'";
export const note2 = "keep comma, ] and comma, ) in this string";

export default defineConfig({
  plugins: [appTools(), tailwindcssPlugin()],
});
