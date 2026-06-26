import { appTools, defineConfig } from '@modern-js/app-tools';

// 普通字符串里的伪 import，不是真实绑定：
const doc = "import { bffPlugin } from '@modern-js/plugin-bff'";

export default defineConfig({
  plugins: [appTools()],
});
