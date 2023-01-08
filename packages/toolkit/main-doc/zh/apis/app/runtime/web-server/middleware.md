---
title: Middleware
---

用于拓展 Modern.js 内置的 Web Server，只有 SSR 请求会经过这些中间件。

与 [Hook](/docs/apis/app/runtime/web-server/hook) 不同的是，Middleware 可以使用 Server 运行时框架拓展。

:::note
更多内容可以查看[自定义 Web Server](/docs/guides/advanced-features/web-server)。
:::

## 使用姿势

```ts
import { Middleware } from '@modern-js/runtime/server';

export const middleware: Middleware = async (context, next) => {};
export const middleware: Middleware[] = [
  async (context, next) => {},
  async (context, next) => {},
];
```

:::info 自定义 Web Server
使用该 API 前，请先执行 `pnpm run new` 新建「自定义 Web Server」源码目录。

```bash
pnpm run new
? 请选择你想要的操作 创建工程元素
? 新建「自定义 Web Server」源码目录
```

:::

## 函数签名

```ts
type MiddlewareContext = {
  response: {
    set: (key: string, value: string) => void;
    status: (code: number) => void;
    cookies: {
      get: (key: string) => string;
      set: (key: string, value: string) => void;
      delete: () => void;
      clear: () => void;
      apply: () => void;
    };
    raw: (
      body: string,
      { status, headers }: { status: number; headers: Record<string, any> },
    ) => void;
    locals: Record<string, any>;
  };
  request: {
    url: string;
    host: string;
    pathname: string;
    query: Record<string, any>;
    cookie: string;
    cookies: {
      get: (key: string) => string;
    };
    headers: IncomingHttpHeaders;
  };
  source: {
    req: IncomingMessage;
    res: ServerResponse;
  };
};

type RequestHandler = (
  context: Context,
  next: NextFunction,
) => Promise<void> | void;
```

### 参数

- `context`：提供当前 Hook 上下文。
  - `response`：提供一系列处理响应的操作
  - `request`：提供一系列获取请求信息的操作
  - `source`：提供 Node.js 原生的 `req` 与 `res` 对象。
- `next`：执行当前 Hook 的下一个监听函数（不影响整体服务端流程）。

## 示例

### 服务端耗时打点

```ts
export const Middleware = () => async (ctx, next) => {
  const start = Date.now();
  ctx.res.once('finish', () => {
    console.log(Date.now() - start);
  });
};
```

### 注入服务端工具 & 数据

Modern.js 提供了 `res.locals` 属性用来存放当前请求的局部变量。

```ts
export const Middleware = () => async (ctx, next) => {
  ctx.res.locals.id = 'Modern.js';
  ctx.res.locals.rpc = createRpcInstance();
});
```
