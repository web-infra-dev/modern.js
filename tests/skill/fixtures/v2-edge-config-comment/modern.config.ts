import { appTools, defineConfig } from '@modern-js/app-tools';

// 旧示例（注释，不应被迁移引擎当成真实配置）：
// export default defineConfig({ runtime: { router: false }, plugins: [appTools({ bundler: 'webpack' })] });
export default defineConfig({
  runtime: {
    router: true,
  },
  plugins: [appTools({ bundler: 'rspack' })],
});
