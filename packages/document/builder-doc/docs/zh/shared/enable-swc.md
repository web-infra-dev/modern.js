首先，你需要执行 `pnpm run new` 启用 SWC 编译：

```bash
? 请选择你想要的操作 启用可选功能
? 请选择功能名称 启用「SWC 编译」
```

执行完成后，你只需在 `modern.config.ts` 文件中注册 Modern.js 的 SWC 插件，即可启用 SWC 编译和压缩能力。

```ts title="modern.config.ts"
import { appTools, defineConfig } from '@modern-js/app-tools';
import { swcPlugin } from '@modern-js/plugin-swc';

export default defineConfig({
  plugins: [appTools(), swcPlugin()],
});
```
