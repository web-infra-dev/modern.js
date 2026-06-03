---
name: modernjs-migrate-to-v3
description: 把一个 Modern.js v2 应用迁移到 v3。在「升级 Modern.js 大版本、modern.config 报废弃警告、要从 webpack/React17/pages 目录迁到 Rspack/React19/routes、自定义 server 报错」时使用。首版只做安全改写，复杂项进人工清单并产出迁移报告。
user-invocable: true
---

# modernjs-migrate-to-v3

把 **Modern.js 2.0 应用**迁移到 **3.0**。原则：**先扫描、出清单、安全改写、复杂项进人工清单**，每批跑校验、可回滚，全程产出可复核的依据。

> 仅适用于「使用 Modern.js 开发的应用项目」。本仓库（Modern.js 框架本身）已是 v3，不要对它跑。

## SOP（务必按顺序）

1. **前置检查**：确认当前是 v2、React ≥17、Node ≥18.20.8（推荐 22+）。建议在干净的 git worktree 上进行，便于回滚。
2. **扫描**：跑 `scripts/scan.mjs <项目根>`，产出
   `<项目根>/.agents/runs/modernjs-migrate/context.json`（扫描结果 + 每项分类）+ 终端报告。**不要只改代码不给依据。**
3. **分批迁移**（每批做完跑 `pnpm install` → `modern build`（必要时 `test`）→ 通过再进下一批；不过就回滚该批）：
   - 批 1 依赖：把所有 `@modern-js/**` 统一升到 v3（固定版本号，不用 `^`/`~`）。
   - 批 2 安全改写（见下「自动」）。
   - 批 3 半自动（见下「半自动」，仅结构简单时改写）。
   - 批 4 人工清单（见下「人工」）。
4. **验证**：`modern build` 通过 + 关键路由/页面 smoke。
5. **报告**：更新 context.json 的处理结果 + 写一份「改了什么 / 为什么 / 待人工项」报告。

## 分类（依据 = 官方 v2→v3 文档，详见 `references/v2-to-v3.md`）

### 自动（安全、机械，可 `scan.mjs --write` 或逐条 guided 改）
- **import 路径映射**：`@modern-js/runtime/bff` → `@modern-js/plugin-bff/runtime`；`@modern-js/runtime/server` → `@modern-js/server-runtime`。（`scan.mjs --write` 已实现这一项，纯 specifier 替换）
- **依赖版本**：`@modern-js/**` 统一升 v3。
- **`dev.port` → `server.port`**（配置项重命名）。
- **Tailwind**：移除 `@modern-js/plugin-tailwindcss`，改 Rsbuild 原生 + `postcss.config.cjs` + `@tailwind` 指令。
- **SSR mode 风险提示**：默认 `'string'`→`'stream'`；React17 项目需手动设回 `'string'`。

### 半自动（仅结构简单时改写，复杂进人工清单）
- **`src/pages` → `src/routes`**（v3 不再支持 pages 约定式路由）：简单静态结构可安全重命名 + 改引用；复杂/动态路由进人工。
- **自定义入口 `src/index.tsx` → `src/entry.tsx`** + bootstrap 函数 → `createRoot()` + `render()`。
- **`App.config` / `App.init`、`routes/layout.tsx` 的 `config`/`init` 导出** → `src/modern.runtime.ts`（`defineRuntimeConfig` / 运行时插件）。注意：v3 **不再支持在 `modern.config.ts` 配 runtime**。
- **`useRuntimeContext()` → `use(RuntimeContext)`**（`isBrowser` 移到返回值顶层）：简单调用可改，复杂解构进人工。

### 人工清单（首版不自动，列出让人确认）
- **自定义 Web Server**：`server/index.ts` → `server/modern.server.ts`；`unstableMiddleware` 数组 → `defineServerConfig({ middlewares })`；Server Context → Hono Context（`c.req`/`c.res`，见 references 对照表）；**中间件现在必须调用 `next()`**；`afterRender` hook → `renderMiddlewares`。语义变化大，务必人工。
- **多入口**的 runtime 配置合并（函数式 `defineRuntimeConfig(entryName => ...)`）。
- **webpack 自定义配置/插件** → Rspack 对应项（多数兼容，但自定义插件需确认）。
- **React Router v7** 不兼容点、**React 19** 相关。
- **`html.appIcon`** 字符串 → 对象格式。

## 安全红线
- 改写**优先 AST/结构化**；纯文本替换只用于无歧义项（如 import 路径映射）。
- **不手改** `pnpm-lock.yaml` / `dist` / `CHANGELOG` / `node_modules` / secret。
- 每批后跑校验，能回滚（干净 worktree / 分支）。
- 复杂、不确定的一律进人工清单，不盲目改。

## 产物（强制）
- `<项目根>/.agents/runs/modernjs-migrate/context.json`：扫描结果 + 每项分类 + 处理状态。
- 最终迁移报告：改了什么 / 为什么 / 待人工项。

更多权威细节让 Agent 检索 `https://modernjs.dev/llms.txt` 或仓库 `guides/upgrade/*`。
