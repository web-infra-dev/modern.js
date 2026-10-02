# 启用 BFF（一体化后端）

> 依据当前仓库文档：`packages/document/docs/zh/guides/advanced-features/bff.mdx`、
> `packages/document/docs/zh/components/enable-bff.mdx`。`scripts/enable.mjs bff` 已自动化以下 1–4 步。

## 1. 安装 BFF 插件（版本与 app-tools 一致）

```bash
pnpm add @modern-js/plugin-bff@<与 @modern-js/app-tools 相同的版本>
```

官方包统一版本号发布，`@modern-js/plugin-bff` 必须与 `@modern-js/app-tools` 同版本。

## 2. 配置 modern.config

```ts title="modern.config.ts"
import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';

export default defineConfig({
  plugins: [appTools(), bffPlugin()],
});
```

## 3. tsconfig 别名

```json title="tsconfig.json"
{
  "compilerOptions": {
    "paths": {
      "@api/*": ["./api/lambda/*"]
    }
  },
  "include": ["api"]
}
```

## 4. 编写 BFF 函数

在 `api/lambda/` 下编写函数，前端直接 import 调用（自动转 HTTP 请求）：

```ts title="api/lambda/index.ts"
export default async () => {
  return { message: 'Hello Modern.js BFF' };
};
```

```tsx title="src/routes/page.tsx"
import hello from '@api/index';

export default function Page() {
  // hello() 在前端调用时会自动发起到 BFF 的请求
  return <button onClick={async () => console.log(await hello())}>call</button>;
}
```

## 进一步

- 自定义 BFF 前缀：`bff.prefix`（见 `configure/app/bff/prefix.mdx`）。
- 跨项目调用、运行时框架扩展等：见 `guides/advanced-features/bff.mdx` 及其子页。
