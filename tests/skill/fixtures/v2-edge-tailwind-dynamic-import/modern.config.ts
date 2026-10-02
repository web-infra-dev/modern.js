import { appTools, defineConfig } from '@modern-js/app-tools';

// 非标准用法：dynamic import 引用 tailwind 插件 —— 不能被当 static 声明删坏
async function loadTailwind() {
  return import('@modern-js/plugin-tailwindcss');
}

export default defineConfig({
  plugins: [appTools()],
});
