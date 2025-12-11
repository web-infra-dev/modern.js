# 自定义 Web Server 变化

本章节覆盖两类旧版自定义 Server API 的升级

- **unstableMiddleware**
- **Hook**

这两种写法在旧版中互斥，迁移时请根据项目实际使用的能力选择对应路径。


## unstableMiddleware

### 核心差异

- **文件结构**：`server/index.ts` → `server/modern.server.ts`
- **导出方式**：`unstableMiddleware` 数组 → `defineServerConfig`
- **Context API**：Modern.js Server Context → Hono Context（`c.req`/`c.res`）
- **中间件执行**：旧版可不调用 `next()`，新版必须调用后续链路才会执行
- **响应方式**：`c.response.raw()` → `c.text()` / `c.json()`

### 文件与导出

```typescript
// 旧版 - server/index.ts
export const unstableMiddleware: UnstableMiddleware[] = [middleware1, middleware2];

// 新版 - server/modern.server.ts
import { defineServerConfig } from '@modern-js/server-runtime';

export default defineServerConfig({
  middlewares: [
    { name: 'middleware1', handler: middleware1 },
    { name: 'middleware2', handler: middleware2 },
  ],
});
```

### 类型与 next 调用

```typescript
// 旧版
import type { UnstableMiddleware, UnstableMiddlewareContext } from '@modern-js/server-runtime';
const middleware: UnstableMiddleware = async (c: UnstableMiddlewareContext, next) => {
  return c.response.raw('response'); // 不调用 next 也会继续渲染
};

// 新版
import { defineServerConfig, type MiddlewareHandler } from '@modern-js/server-runtime';
const middleware: MiddlewareHandler = async (c, next) => {
  await next(); // 必须调用
  return c.text('response');
};
```

### Context API 对照

| 旧版 API               | 新版 API                 | 说明            |
| -------------------- | ---------------------- | ------------- |
| `c.request.cookie`   | `getCookie(c, 'key')`  | Cookie 读取      |
| `c.req.cookie()`     | `getCookie(c, 'key')`  | Hono v4 已废弃    |
| `c.request.pathname` | `c.req.path`           | 请求路径          |
| `c.request.host`     | `c.req.header('Host')` | 请求主机          |
| `c.request.query`    | `c.req.query()`        | 查询参数          |
| `c.request.headers`  | `c.req.header()`       | 请求头           |
| `c.response.status`  | `c.status()`           | 响应状态码         |
| `c.response.set`     | `c.res.headers.set`    | 设置响应头         |
| `c.response.raw`     | `c.text` / `c.json`    | 响应体           |


## afterRender Hook

`afterRender` 仅用于页面渲染完成后的 HTML 处理。

```typescript
import { defineServerConfig, type MiddlewareHandler } from '@modern-js/server-runtime';

const renderMiddleware: MiddlewareHandler = async (c, next) => {
  await next(); // 先等待页面渲染
  const { res } = c;
  const html = await res.text();

  const modified = html
    .replace('<head>', '<head><meta name="author" content="ByteDance">')
    .replace('<body>', '<body><div id="loading">Loading...</div>')
    .replace('</body>', '<script>console.log("Page loaded")</script></body>');

  c.res = c.body(modified, { status: res.status, headers: res.headers });
};

export default defineServerConfig({
  renderMiddlewares: [{ name: 'custom-content-injection', handler: renderMiddleware }],
});
```
