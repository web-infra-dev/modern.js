# 自定义 Web Server 迁移（人工项）

> 依据 `guides/upgrade/web-server`。语义变化大，务必人工。两类旧 API 互斥，按项目实际选择。

## 文件与导出

`server/index.ts` → **`server/modern.server.ts`**。

```ts
// 旧 - server/index.ts
export const unstableMiddleware: UnstableMiddleware[] = [middleware1, middleware2];

// 新 - server/modern.server.ts
import { defineServerConfig } from '@modern-js/server-runtime';
export default defineServerConfig({
  middlewares: [
    { name: 'middleware1', handler: middleware1 },
    { name: 'middleware2', handler: middleware2 },
  ],
});
```

## 中间件：必须 await next()

```ts
// 旧：不调用 next 也会继续渲染
const m: UnstableMiddleware = async (c, next) => c.response.raw('resp');
// 新：必须 await next()
import { defineServerConfig, type MiddlewareHandler } from '@modern-js/server-runtime';
const m: MiddlewareHandler = async (c, next) => {
  await next();
  return c.text('resp');
};
```

## Context API：Modern.js Server Context → Hono Context

| 旧 | 新 |
| --- | --- |
| `c.request.cookie` / `c.req.cookie()` | `getCookie(c, 'key')` |
| `c.request.pathname` | `c.req.path` |
| `c.request.host` | `c.req.header('Host')` |
| `c.request.query` | `c.req.query()` |
| `c.request.headers` | `c.req.header()` |
| `c.response.status` | `c.status()` |
| `c.response.set` | `c.res.headers.set` |
| `c.response.raw` | `c.text` / `c.json` |

## afterRender Hook → renderMiddlewares

`hook` 中的 `afterRender`（直接改 HTML 字符串）→ `defineServerConfig` 的 `renderMiddlewares`（通过中间件获取/修改响应）。
