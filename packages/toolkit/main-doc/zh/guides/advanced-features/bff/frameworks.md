---
sidebar_position: 3
title: 运行时框架
---

Modern.js 的 BFF 支持不同的运行时框架，当前 Modern.js 的 BFF 支持两种运行时框架 [Express.js](https://expressjs.com/) 和 [Koa.js](https://koajs.com/)。

## 函数写法

在函数写法下，各类运行时框架仅中间件写法存在差异，其他实现基本相同。这里以 Express 为例，介绍如何在 `api/_app.ts` 中，手写一个中间件，添加权限校验：

```ts
import { hook } from '@modern-js/runtime/server';
import { Request, Response, NextFunction } from 'express';

export default hook(({ addMiddleware }) => {
  addMiddleware(async (req: Request, res: Response, next: NextFunction) => {
    if (req.url !== '/api/login') {
      const sid = req?.cookies?.sid;
      if (!sid) {
        res.status(400);
        res.json({ code: -1, message: 'need login' });
      } else {
        next();
      }
    } else {
      next();
    }
  });
});
```

然后添加一个普通的 BFF 函数 `/api/hello.ts`：

```ts
export default async () => {
  return 'Hello Modern.js';
};
```

最后在前端 `src/App.tsx` 添加接口的访问代码，直接使用一体化的方式调用：

```ts
import { useState, useEffect } from 'react';
import { get as hello } from '@api/hello';

export default () => {
  const [text, setText] = useState('');

  useEffect(() => {
    async function fetchMyApi() {
      const { message } = await hello();
      setText(message);
    }

    fetchMyApi();
  }, []);

  return <p>{text}</p>;
};
```

然后 `pnpm run dev` 启动项目，访问 `http://localhost:8080/` 会发现 `/api/hello` 的请求被拦截了：

![Network](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/network2.png)

最后再修改前端代码 `src/App.tsx`，在访问 `/api/hello` 前先调用登录接口：

```ts
import { useState, useEffect } from 'react';
import { get as hello } from '@api/hello';
import { post as login } from '@api/login';

export default () => {
  const [text, setText] = useState('');

  useEffect(() => {
    async function fetchAfterLogin() {
      const { code } = await login();
      if (code === 0) {
        const { message } = await hello();
        setText(message);
      }
    }
    fetchAfterLogin();
  }, []);

  return <p>{text}</p>;
};
```

刷新页面，可以看到 `/api/hello` 访问成功：

![Network](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/network3.png)

以上代码模拟了在 `/api/_app.ts` 中添加中间件的方式，实现了简易的登录功能。同样，可以在这个钩子文件中实现其他功能来扩展 BFF Server。

## 框架写法

框架写法下，Modern.js 不会收集 `api/_app.ts` 中的中间件，运行流程由插件自行控制。

### Express

Express 的框架写法支持可在 `api/app.[tj]s` 定义 API Server 的启动逻辑，执行应用的初始化工作，添加全局中间件，声明路由，甚至扩展原有框架等。

BFF 函数定义的路由会在 `app.ts` 文件定义的路由之后注册，所以在这里你也可以拦截 BFF 函数定义的路由，进行预处理或是提前响应。

```ts title="api/app.ts"
import express from "express";

const app = express();

app.put("/user", function (req, res) {
  res.send("Got a PUT request at /user");
});

app.use(async (req, res, next) => {
  console.info(`access url: ${req.url}`);
  next();
});

export default app;
```

### Koa

Koa 框架写法与 Express 类似，支持在 `app.[tj]s` 定义 API Server 的启动逻辑，执行应用的初始化工作，添加全局中间件，声明路由，扩展原有框架等。

BFF 函数定义的路由会在 `app.ts` 文件定义的路由之后注册，所以在这里你也可以拦截 BFF 函数定义的路由，进行预处理或是提前响应。

:::caution 注意
在框架写法下，当没有 `app.ts` 的时候，Modern.js 默认会添加 `koa-body`；当有 `app.ts` 时，如果开发者希望使用带有 Body 的 BFF 函数，需要确保 `koa-body` 中间件已经添加。
:::

```ts title=api/app.ts
import koa from "koa";

const app = new Koa();

app.put("/user", function (req, res) {
  res.send("Got a PUT request at /user");
});

app.use(async (ctx, next) => {
  console.info(`access url: ${ctx.url}`);
  await next();
});

export default app;
```
