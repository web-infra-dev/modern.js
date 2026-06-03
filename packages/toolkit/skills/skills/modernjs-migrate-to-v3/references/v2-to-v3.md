# Modern.js v2 → v3 breaking changes（参考）

> 摘自官方 `guides/upgrade/*`。Agent 改写时以此为准，不确定再查 `modernjs.dev/llms.txt`。

## 总览
- 构建：**webpack 不再支持**，默认 **Rspack**（与 Rsbuild 对齐；大部分 webpack 配置兼容，自定义插件需确认有 Rspack 版本）。
- React **19** + **React Router v7**（默认）。需 React 5/6 时走自控式路由。
- 插件系统重构（CLI/Runtime/Server）。
- 前置：React ≥17，Node ≥18.20.8（推荐 22+）。

## 入口（entry）
- 自定义入口 `src/index.tsx` → **`src/entry.tsx`**。
- bootstrap 函数 `export default (App, bootstrap) => {...}` → `createRoot()` + `render()`：
  ```ts
  import { createRoot } from '@modern-js/runtime/react';
  import { render } from '@modern-js/runtime/browser';
  const ModernRoot = createRoot();
  beforeRender().then(() => render(<ModernRoot />));
  ```
- `App.config` → `src/modern.runtime.ts` 的 `defineRuntimeConfig({...})`。
- `App.init` → 运行时插件（`defineRuntimeConfig({ plugins: [initPlugin()] })`，插件 `setup` 里 `init({context}){...}`）。
- `routes/layout.tsx` 的 `export const config` / `export const init` → 同上迁到 `modern.runtime.ts`，并删除 layout 里的导出。
- **v3 不再支持在 `modern.config.ts` 里配 runtime，必须用 `modern.runtime.ts`。**
- 多入口：`defineRuntimeConfig(entryName => {... 按入口名返回配置 ...})`。

## 路由
- **不再支持 `src/pages` 约定式路由** → 重命名为 `src/routes`，并更新所有引用 pages 的导入。

## 配置（modern.config.ts）
- `dev.port` → `server.port`。
- `html.appIcon`：字符串 → 对象 `{ icons: [{ src, size }] }`。
- SSR：`server.ssr.mode` 默认 `'string'` → `'stream'`。React17 项目需手动设回 `'string'`。

## import 路径映射
| 旧 | 新 |
|---|---|
| `@modern-js/runtime/bff` | `@modern-js/plugin-bff/runtime` |
| `@modern-js/runtime/server` | `@modern-js/server-runtime` |

## API
- `useRuntimeContext()` → `use(RuntimeContext)`（或 `useContext(RuntimeContext)`）。`isBrowser` 从 `context.isBrowser` 移到返回值顶层；`context` 简化为只含 `request`/`response`。

## Tailwind
- 移除 `@modern-js/plugin-tailwindcss`（依赖 + 配置）→ Rsbuild 原生：
  - 建 `postcss.config.cjs`：`module.exports = { plugins: { tailwindcss: {} } }`
  - Tailwind 配置统一进 `tailwind.config.{ts,js}`
  - CSS 引入 `@import 'tailwindcss/*.css'` → `@tailwind base/components/utilities;`

## 自定义 Web Server（语义变化大，建议人工）
- 文件：`server/index.ts` → **`server/modern.server.ts`**。
- `unstableMiddleware` 数组 → `defineServerConfig({ middlewares: [{ name, handler }] })`（`@modern-js/server-runtime`）。
- Context：Modern.js Server Context → **Hono Context**：
  | 旧 | 新 |
  |---|---|
  | `c.request.cookie` / `c.req.cookie()` | `getCookie(c, 'key')` |
  | `c.request.pathname` | `c.req.path` |
  | `c.request.host` | `c.req.header('Host')` |
  | `c.request.query` | `c.req.query()` |
  | `c.request.headers` | `c.req.header()` |
  | `c.response.status` | `c.status()` |
  | `c.response.set` | `c.res.headers.set` |
  | `c.response.raw` | `c.text` / `c.json` |
- **中间件必须 `await next()`**（旧版不调用也会渲染，新版不调用后续链路不执行）。
- `afterRender` hook → `renderMiddlewares`。
