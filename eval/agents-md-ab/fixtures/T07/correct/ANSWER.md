# 给已有项目启用 BFF（Modern.js v3）

v3 已移除 `modern new`/`pnpm new` 命令，需手动启用：

1. 安装插件（版本与 @modern-js/app-tools 一致）：`pnpm add @modern-js/plugin-bff`，同时安装运行时框架 `pnpm add hono`（本项目二者已预装，跳过）。
2. 在 `modern.config.ts` 注册插件：

   ```ts
   import { bffPlugin } from '@modern-js/plugin-bff';
   export default defineConfig({ plugins: [appTools(), bffPlugin()] });
   ```

3. 在 `tsconfig.json` 的 `compilerOptions.paths` 增加 `"@api/*": ["./api/lambda/*"]`，并把 `"api"` 加进 `include`。
4. 在 `api/lambda/` 目录下创建接口文件（如 `hello.ts`），`export const get = async () => ...`。
