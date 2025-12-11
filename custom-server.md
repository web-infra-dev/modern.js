如果项目中存在 `server/index.ts` 文件，则任何项目使用了旧版自定义 Server。如果项目是一个 SSR 项目，则进行以下改造：

# unstableMiddleware 迁移至新版 Web Server 指南

从已废弃的 `unstableMiddleware` 迁移到新版自定义 Web Server 的代码差异指南。



## 核心差异



### 文件和导出结构

```typescript
// 旧版 - server/index.ts
export const unstableMiddleware: UnstableMiddleware[] = [middleware1, middleware2];

// 新版 - server/edenx.server.ts
export default defineServerConfig({
  middlewares: [
    { name: 'middleware1', handler: middleware1 },
    { name: 'middleware2', handler: middleware2 }
  ]
});
```



### 中间件类型定义



```typescript
// 旧版类型
import { UnstableMiddleware, UnstableMiddlewareContext } from '@edenx/server-runtime';

const middleware: UnstableMiddleware = async (c: UnstableMiddlewareContext, next) => {};

// 新版类型
import { defineServerConfig, type MiddlewareHandler } from '@edenx/server-runtime';

const middleware: MiddlewareHandler = async (c, next) => {};
```



## API 迁移对照表



### Context 请求操作



| 旧版 API               | 新版 API                 | 说明                      |
| -------------------- | ---------------------- | ----------------------- |
| `c.request.cookie`   | `getCookie(c, 'key')`  | Cookie 读取               |
| `c.req.cookie()`     | `getCookie(c, 'key')`  | Hono v4 Cookie 读取（废弃方法） |
| `c.request.pathname` | `c.req.path`           | 请求路径                    |
| `c.request.host`     | `c.req.header('Host')` | 请求主机                    |
| `c.request.query`    | `c.req.query()`        | 查询参数                    |
| `c.request.headers`  | `c.req.header()`       | 请求头                     |



### Context 响应操作



| 旧版 API                         | 新版 API                            | 说明        |
| ------------------------------ | --------------------------------- | --------- |
| `c.response.status(200)`       | `c.status(200)`                   | 状态码       |
| `c.response.set('key', 'val')` | `c.res.headers.set('key', 'val')` | 响应头       |
| `c.response.cookies.set(...)`  | `setCookie(c, ...)`               | Cookie 设置 |
| `c.response.raw(data)`         | `c.text(data)` 或 `c.json(data)`   | 响应体       |



### 关键变更：next() 调用



```typescript
// 旧版 - 即使不调用 next()，渲染也会执行
const oldMiddleware: UnstableMiddleware = async (c, next) => {
  return c.response.raw('response'); // 不调用 next() 也行
};

// 新版 - 必须调用 next() 才会执行后续中间件
const newMiddleware: MiddlewareHandler = async (c, next) => {
  await next(); // 必须调用
  return c.text('response');
};
```



## 常见迁移场景



### 请求计时

```typescript
// 旧版
const timing: UnstableMiddleware = async (c, next) => {
  const start = Date.now();
  await next();
  console.log(`dur=${Date.now() - start}`);
};

// 新版
const timing: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  await next();
  c.res.headers.set('server-timing', `total;dur=${Date.now() - start}`);
};
```



### API 路由处理

```typescript
// 旧版
const apiHandler: UnstableMiddleware = async (c, next) => {
  if (c.request.pathname.startsWith('/api')) {
    c.response.status(200);
    c.response.set('content-type', 'application/json');
    return c.response.raw(JSON.stringify({ data: 'value' }));
  }
  await next();
};

// 新版
const apiHandler: MiddlewareHandler = async (c, next) => {
  if (c.req.path.startsWith('/api')) {
    return c.json({ data: 'value' }, 200);
  }
  await next();
};
```



### Cookie 操作

```typescript
// 旧版
const cookieHandler: UnstableMiddleware = async (c, next) => {
  const sessionId = c.request.cookies.get('session_id');
  if (!sessionId) {
    c.response.cookies.set('session_id', 'new-session', { httpOnly: true });
  }
  await next();
};

// 新版
import { getCookie, setCookie } from 'hono/cookie';

const cookieHandler: MiddlewareHandler = async (c, next) => {
  const sessionId = getCookie(c, 'session_id');
  if (!sessionId) {
    setCookie(c, 'session_id', 'new-session', { httpOnly: true });
  }
  await next();
};
```



### 数据注入

```typescript
// 旧版和新版 - 注入方式相同
const dataHandler: MiddlewareHandler = async (c, next) => {
  c.set('message', 'Hello from server');
  await next();
};

// DataLoader 读取
const loader = () => {
  const ctx = useHonoContext();
  const message = ctx.get('message');
  return { message };
};
```



### Stream 响应处理

```typescript
// 旧版 - Hono v3
const streamHandler: MiddlewareHandler = async (c, next) => {
  if (c.req.path.startsWith('/api/stream')) {
    return c.stream((stream) => {
      stream.write('data: hello\n\n');
      setTimeout(() => stream.write('data: world\n\n'), 1000);
    });
  }
  await next();
};

// 新版
import { stream } from 'hono/streaming';

const streamHandler: MiddlewareHandler = async (c, next) => {
  if (c.req.path.startsWith('/api/stream')) {
    return stream(c, async (stream) => {
      stream.write('data: hello\n\n');
      setTimeout(() => stream.write('data: world\n\n'), 1000);
    });
  }
  await next();
};
```



### JSON 响应处理

```typescript
// 旧版 - Hono v3 (c.jsonT 已废弃)
const jsonHandler: MiddlewareHandler = async (c, next) => {
  if (c.req.path.startsWith('/api/data')) {
    return c.jsonT({ message: 'Hello World' }); // 已废弃
  }
  await next();
};

// 新版
const jsonHandler: MiddlewareHandler = async (c, next) => {
  if (c.req.path.startsWith('/api/data')) {
    return c.json({ message: 'Hello World' }); // 使用 c.json
  }
  await next();
};
```



## 完整迁移步骤



### 配置文件

确保 `server/edenx.server.ts` 文件存在，如果不存在，则进行创建。



### 注册中间件

在 `server/edenx.server.ts` 中使用 `defineServerConfig` 注册中间件：



```typescript
import { defineServerConfig, type MiddlewareHandler } from '@edenx/server-runtime';

// 定义中间件
const middleware1: MiddlewareHandler = async (c, next) => {
  // 中间件逻辑
  await next();
};

const middleware2: MiddlewareHandler = async (c, next) => {
  // 中间件逻辑
  await next();
};

// 注册中间件
export default defineServerConfig({
  middlewares: [
    { name: 'middleware1', handler: middleware1 },
    { name: 'middleware2', handler: middleware2 }
  ]
});
```



## 迁移要点



1\. **文件结构**: `server/index.ts` → `server/edenx.server.ts`

2\. **导出方式**: `unstableMiddleware` 数组 → `defineServerConfig` 对象

3\. **Context API**: 自定义 Context → Hono Context

4\. **next() 调用**: 可选 → **必须调用**

5\. **响应方式**: `c.response.raw()` → `c.text()`/\`c.json()\`

6\. **注册方式**: 直接导出数组 → 使用 \`defineServerConfig\` 包装注册

7\. **Cookie 处理**: \`c.req.cookie()\` → \`getCookie(c, 'key')\` (需从 \`hono/cookie\` 导入)

8\. **请求头处理**: 某些 \`c.req\` 方法 → \`c.req.raw\` 方法 (直接使用原生 Request API)



# Hook 迁移至新版 Web Server 指南

## 概述

`afterRender` Hook 用于在页面渲染完成后执行自定义逻辑，主要用于 HTML 内容注入和模板修改。新版自定义 Web Server 使用 `RenderMiddleware` 替代 `afterRender` Hook。



新版自定义 Web Server 的 `Middleware` 应该写在`server/edenx.server.ts` 文件中。



## 旧版 afterRender Hook



```typescript
import type { AfterRenderHook } from '@edenx/server-runtime';

export const afterRender: AfterRenderHook = (ctx, next) => {
  // 向 head 中注入内容
  ctx.template.prependHead('<meta name="author" content="ByteDance">');

  // 向 body 开始位置注入内容
  ctx.template.prependBody('<div id="loading">Loading...</div>');

  // 向 body 结束位置注入内容
  ctx.template.appendBody('<script>console.log("Page loaded")</script>');

  next();
};
```



## 新版 RenderMiddleware 迁移



### 基本迁移方式



```typescript
import {
  defineServerConfig,
  type MiddlewareHandler,
} from '@edenx/server-runtime';

const renderMiddleware: MiddlewareHandler = async (c, next) => {
  await next();

  // 获取响应内容
  const { res } = c;
  const text = await res.text();

  // 修改 HTML 内容
  const modifiedText = text
    .replace('<head>', '<head><meta name="author" content="ByteDance">')
    .replace('<body>', '<body><div id="loading">Loading...</div>')
    .replace('</body>', '<script>console.log("Page loaded")</script></body>');

  // 重新设置响应
  c.res = c.body(modifiedText, {
    status: res.status,
    headers: res.headers,
  });
};

export default defineServerConfig({
  renderMiddlewares: [
    {
      name: 'custom-content-injection',
      handler: renderMiddleware,
    },
  ],
});
```



### 迁移对应关系



| 旧版 afterRender                       | 新版 RenderMiddleware                             |
| ------------------------------------ | ----------------------------------------------- |
| `ctx.template.prependHead(fragment)` | `text.replace('<head>', '<head>' + fragment)`   |
| `ctx.template.appendHead(fragment)`  | `text.replace('</head>', fragment + '</head>')` |
| `ctx.template.prependBody(fragment)` | `text.replace('<body>', '<body>' + fragment)`   |
| `ctx.template.appendBody(fragment)`  | `text.replace('</body>', fragment + '</body>')` |
| `ctx.template.set(html)`             | 直接修改整个 text                                     |
| `ctx.template.get()`                 | 直接使用 text                                       |



### 注意事项



1\. **执行时机**: RenderMiddleware 必须等待 \`await next()\` 执行后才能获取渲染后的 HTML 内容

2\. **性能考虑**: 处理大量文本内容时注意性能影响

3\. **响应头**: 保持原有的响应头信息

4\. **错误处理**: 添加适当的错误处理逻辑



### 完整示例



```typescript
import {
  defineServerConfig,
  type MiddlewareHandler,
} from '@edenx/server-runtime';

const contentInjection: MiddlewareHandler = async (c, next) => {
  await next();

  try {
    const { res } = c;
    const originalHtml = await res.text();

    // 注入 meta 标签
    const withMeta = originalHtml.replace(
      '<head>',
      '<head><meta name="author" content="ByteDance">'
    );

    // 注入 loading 元素
    const withLoading = withMeta.replace(
      '<body>',
      '<body><div id="loading">Loading...</div>'
    );

    // 注入脚本
    const finalHtml = withLoading.replace(
      '</body>',
      '<script>document.getElementById("loading").style.display="none";</script></body>'
    );

    c.res = c.body(finalHtml, {
      status: res.status,
      headers: res.headers,
    });
  } catch (error) {
    console.error('Content injection failed:', error);
    // 保持原始响应不变
  }
};

export default defineServerConfig({
  renderMiddlewares: [
    {
      name: 'content-injection',
      handler: contentInjection,
    },
  ],
});
```



