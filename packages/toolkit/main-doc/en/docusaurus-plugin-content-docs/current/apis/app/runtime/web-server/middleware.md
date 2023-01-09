---
title: Middleware
---

Used to extend Modern.js built-in Web Server, only SSR requests are handled by these middleware.

Unlike [Hook](/docs/apis/app/runtime/web-server/hook), middleware can be extended using the framework plugin.

:::note
For more detail, see [Extend Web Server](/docs/guides/advanced-features/web-server)。
:::

## Usage

```ts
import { Middleware } from '@modern-js/runtime/server';

export const middleware: Middleware = async (context, next) => {};
export const middleware: Middleware[] = [
  async (context, next) => {},
  async (context, next) => {},
];
```

:::info
使用该 API 前，请先执行 `pnpm run new` 新建「Web Server 扩展」源码目录。

```bash
pnpm run new
? 请选择你想要的操作 创建工程元素
? 新建「Web Server 扩展」源码目录
```
:::

## Function Signature

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

### Input

- `context`: Middleware context.
  - `response`: provides a series of methods to process the response.
  - `request`: provides a series of methods to get request info.
  - `source`: provides Node.js native `req` and `res` object。
- `next`: call next listener（not affect the server process, only current hook）。

## Example

### Tracking

```ts
export const Middleware = () => async (ctx, next) => {
  const start = Date.now();
  ctx.res.once('finish', () => {
    console.log(Date.now() - start);
  });
};
```

### Inject Tools & Data

Modern.js provides `res.locals` to store local variables for the current request.

```ts
export const Middleware = () => async (ctx, next) => {
  ctx.res.locals.id = 'Modern.js';
  ctx.res.locals.rpc = createRpcInstance();
});
```
