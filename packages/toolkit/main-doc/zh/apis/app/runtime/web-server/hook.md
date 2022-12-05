---
title: Hook
---

用于拓展 Modern.js 内置的 Web Server，非 BFF 请求会经过这些中 Hook 的处理。

:::note
更多内容可以查看[自定义 Web Server](/docs/guides/advanced-features/web-server)。
:::

## 使用姿势

```ts
import { AfterMatchHook, AfterRenderHook } from '@modern-js/runtime/server';

export const afterMatch: AfterMatchHook = (context, next) => {}
export const afterRender: AfterRenderHook = (context, next) => {}
```

:::info 自定义 Web Server
使用该 API 前，请先执行 `pnpm run new` 新建「自定义 Web Serve」源码目录。

```bash
pnpm run new
? 请选择你想要的操作 创建工程元素
? 新建「自定义 Web Server」源码目录
```
:::

## 函数签名

```ts
type HookContext = {
  response: {
    set: (key: string, value: string) => void;
    status: (code: number) => void;
    cookies: {
      get: (key: string) => string;
      set: (key: string, value: string) => void;
      delete: () => void;
      clear: () => void;
    };
    raw: (
      body: string,
      { status, headers }: { status: number; headers: Record<string, any> },
    ) => void;
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
};

function Hook(context: HookContext, next: NextFunction): Promsie<void> | void;
```

另外，不同 Hook 额外提供了不同的上下文。目前 Modern.js 支持 `AtferMatch` 和 `AfterRender` 两个 Hook。

```ts
type AfterMatchContext = HookContext & {
  router: {
    redirect: (url: string, status: number) => void;
    rewrite: (entry: string) => void;
  };
}

type AfterRenderContext = {
  template: {
    get: () => string;
    set: (html: string) => void;
    prependHead: (fragment: string) => void;
    appendHead: (fragment: string) => void;
    prependBody: (fragment: string) => void;
    appendBody: (fragment: string) => void;
  };
};
```


### 参数

- `context`：提供当前 Hook 上下文。
  - `response`：提供一系列处理响应的操作
  - `request`：提供一系列获取请求信息的操作
  - `router`：提供对响应路由的快捷操作
  - `template`：提供对响应内容的快捷操作
- `next`：执行当前 Hook 的下一个监听函数（不影响整体服务端流程）。

## 示例

### Redirect

将页面重定向到站点外的页面，例如跳转到统一登录页：

```ts
import type { AfterMatch } from '@modern-js/runtime/server';

export const afterMatch: AfterMatch = async (ctx, next) => {
  ctx.router.redirect('https://website.com/login', 302);
};
```

### Rewrite

将页面重写到当前站点的其他页面，例如同一个路由根据 UA 返回适配不同端的页面：

```ts
import type { AfterMatch } from '@modern-js/runtime/server';

export const afterMatch: AfterMatch = async (ctx, next) => {
  ctx.router.rewrite('mobile');
};
```

### HTML 内容注入

为页面注入某些与渲染主体无关的 HTML 内容，如脚本、页面骨架等：

```ts
import type { AfterRender } from '@modern-js/runtime/server';

export const afterRender: AfterRenderHook = (context, next) => {
  ctx.template.prependBody('<div>Footer</div>');
}
```
