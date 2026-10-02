import { appTools, defineConfig } from '@modern-js/app-tools';

// 文档里给用户看的迁移前示例字符串（不是真实配置）：
const legacySample =
  "defineConfig({ runtime: { router: true }, plugins: [appTools({ bundler: 'rspack' })] })";

export default defineConfig({
  plugins: [appTools()],
});

export const docs = { legacySample };
