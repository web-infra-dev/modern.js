# 启用 SSG（静态站点生成）

> 依据当前仓库文档：`packages/document/docs/zh/components/enable-ssg.mdx`、
> `packages/document/docs/zh/configure/app/output/ssg.mdx`、`guides/basic-features/render/ssg.mdx`。
> `scripts/enable.mjs ssg` 已自动化 1–2 步。

## 1. 安装 SSG 插件（版本与 app-tools 一致）

```bash
pnpm add @modern-js/plugin-ssg@<与 @modern-js/app-tools 相同的版本>
```

官方包统一版本号发布，`@modern-js/plugin-ssg` 必须与 `@modern-js/app-tools` 同版本。

## 2. 配置 modern.config

```ts title="modern.config.ts"
import { appTools, defineConfig } from '@modern-js/app-tools';
import { ssgPlugin } from '@modern-js/plugin-ssg';

export default defineConfig({
  plugins: [appTools(), ssgPlugin()],
  output: {
    ssg: true,
  },
});
```

> 若已有 `output` 块，`enable.mjs` 会把 `ssg: true` **合并**进去而非覆盖其它字段。

## 3. 按需细化（人工）

- 按入口/路由维度的 SSG：`output.ssg` 也可为对象/函数，见 `configure/app/output/ssg.mdx`、
  `configure/app/output/ssgByEntries.mdx`。
- 动态路由、数据获取（`page.data.ts`）下的预渲染：见 `guides/basic-features/render/ssg.mdx`。
