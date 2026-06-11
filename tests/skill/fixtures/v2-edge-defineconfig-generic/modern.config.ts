import { appTools, defineConfig } from '@modern-js/app-tools';

// v2 文档支持的静态泛型写法（带 bundler 类型参数）
export default defineConfig<'rspack'>({
  runtime: {
    router: true,
  },
  plugins: [appTools({ bundler: 'rspack' })],
});
