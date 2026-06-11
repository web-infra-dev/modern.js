# 其它功能（manual checklist）

> 第一版未自动化，依据当前仓库文档给出人工步骤。装官方插件时，**版本一律与 `@modern-js/app-tools` 一致**
> （官方包统一版本号）。改 `modern.config` 时把插件**追加到顶层 `plugins`**，不要动其它插件顺序。

> SSG（`ssg`）已自动化：见 `references/enable-ssg.md` 与 `node scripts/enable.mjs ssg`。

## 自定义 Web Server（`server`）

依据 `packages/document/docs/zh/apis/app/hooks/server/server.mdx`（与 `guides/upgrade/web-server`）：

1. 新建 `server/modern.server.ts`：
   ```ts
   import { defineServerConfig } from '@modern-js/server-runtime';
   export default defineServerConfig({
     middlewares: [/* { name, handler } */],
   });
   ```
2. 需要 `@modern-js/server-runtime`（与 app-tools 同版本）。中间件 Context 为 Hono，必须 `await next()`。

## Tailwind CSS（`tailwindcss`）

依据 `packages/document/docs/zh/guides/basic-features/css/tailwindcss.mdx`：

v3 **不再使用 `@modern-js/plugin-tailwindcss`**，改为 Rsbuild 原生方式：

1. 安装 `tailwindcss`（v3 或 v4）及其 PostCSS 依赖，按 Rsbuild 文档配置：
   - Tailwind v3：https://rsbuild.rs 的 tailwindcss-v3 指南
   - Tailwind v4：https://rsbuild.rs 的 tailwindcss 指南
2. 创建 `tailwind.config.{ts,js}`（IDE 智能补全也需要）。
3. 在入口 CSS 引入 Tailwind 指令（`@tailwind base/components/utilities;` 或 v4 的 `@import`）。

> 若项目是从 v2 迁移来的、仍有 `@modern-js/plugin-tailwindcss`，用 `modernjs-migrate-to-v3` 处理。

## 微前端（`microFrontend`）—— 不是本 skill 的当前启用项

**微前端不在 scan 的「可启用项」能力矩阵里**。原因：v3 已无 `@modern-js/plugin-garfish`，微前端是
**Module Federation / `masterApp` 主从拓扑的架构决策**（基座、子应用清单、路由分发），自动化会改坏语义。
它仍是 Modern.js 的能力，只是需**按独立架构方案**处理：

- 依据 `components/micro-frontend.mdx`、`micro-master-manifest-config.mdx`、`micro-runtime-config.mdx`
  选择 Module Federation / 运行时方案；
- 主应用在 `src/modern.runtime.ts` 配 `masterApp`（apps 列表）；子应用暴露入口 + 配置 manifest。

（`node scripts/enable.mjs microFrontend` 仍会输出上述可执行 checklist + 原因，不静默缺失。）

---

> 现状：`bff` / `ssg` / `styled-components` 已自动化（auto）；`tailwindcss` / `server` 为脚手架（scaffold，
> 骨架自动 + 语义人工）。详见 `node scripts/scan.mjs` 的能力矩阵。
