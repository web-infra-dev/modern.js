---
title: Hook
---

Used to extend Modern.js built-in Web Server, requests except BFF are handled by these hooks.

:::note
For more detail, see [Extend Web Server](/docs/guides/advanced-features/web-server)。
:::

## Usage

```ts
import { AfterMatchHook, AfterRenderHook } from '@modern-js/runtime/server';

export const afterMatch: AfterMatchHook = (context, next) => {};
export const afterRender: AfterRenderHook = (context, next) => {};
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

different Hooks additionally provide different contexts. Currently Modern.js support `AtferMatch` and `AfterRender`.

```ts
type AfterMatchContext = HookContext & {
  router: {
    redirect: (url: string, status: number) => void;
    rewrite: (entry: string) => void;
  };
};

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

### Input

- `context`: Hook context.
  - `response`: provides a series of methods to process the response.
  - `request`: provides a series of methods to get request info.
  - `router`: provides methods on routing.
  - `template`: provides methods on content.
- `next`: call next listener（not affect the server process, only current hook）。

## Example

### Redirect

Redirect to pages outside the site, for example to login page:

```ts
import type { AfterMatch } from '@modern-js/runtime/server';

export const afterMatch: AfterMatch = async (ctx, next) => {
  ctx.router.redirect('https://website.com/login', 302);
};
```

### Rewrite

Rewrite to pages of the current site, for example, the same route returns pages that are adapted to different UA:

```ts
import type { AfterMatch } from '@modern-js/runtime/server';

export const afterMatch: AfterMatch = async (ctx, next) => {
  ctx.router.rewrite('mobile');
};
```

### HTML Inject

Inject some HTML content to the page, such as scripts, page skeletons, etc.:

```ts
import type { AfterRender } from '@modern-js/runtime/server';

export const afterRender: AfterRenderHook = (context, next) => {
  ctx.template.prependBody('<div>Footer</div>');
};
```
