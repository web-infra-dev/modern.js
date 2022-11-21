---
sidebar_position: 4
title: 运行时框架
---

如前面章节所说，目前 Modern.js 的 BFF 支持 4 种主流的 Server 框架，可以根据自身偏好选择。

多框架支持也是【 一体化 BFF 】中重要的一环，多数情况下，开发者直接使用钩子文件来扩展 BFF 函数，无需关心通过框架启动服务、日志输出等应用级别的问题。

所有框架均支持 BFF 函数的所有能力，并且使用方式是相同的，例如：

- RESTful API
- Schema 模式
- Hooks(useContext)
- 不同的数据类型
- 动态路由
- 一体化调用

Modern.js BFF 中兼容了这些框架大部分的规范，开发者可以直接使用对应 Server 框架的约定和生态。

每一种框架都提供了两类扩展写法 BFF 函数的方式，分别是【 函数写法 】和【 框架写法 】。

## 函数写法

在上一章节中，简单的演示了 Express 扩展 BFF 函数的示例。

函数写法就是通过添加钩子文件 `_app.ts` 的方式，编写中间件逻辑来扩展 BFF 函数。

### [Express](https://expressjs.com/)

Express 的函数写法，可以通过在 `_app.[tj]s` 下添加 `express` 的中间件：

```ts
import { hook } from "@modern-js/runtime/server";

export default hook(({ addMiddleware }) => {
  addMiddleware(async (req, res, next) => {
    req.query.id = "express";
    await next();
  });
});
```

### [Koa](https://koajs.com/)

Koa 函数写法下，可以通过在 `_app.[tj]s` 下添加 koa 的中间件：

```ts
import { hook } from "@modern-js/runtime/server";

export default hook(({ addMiddleware }) => {
  addMiddleware(async (ctx, next) => {
    console.info(`access url: ${ctx.url}`);
    next();
  });
});
```

## 框架写法

框架写法是一种使用框架分层结构来扩展 BFF 函数的方式。

和函数写法相比，框架写法虽然能够利用更多框架的结构，在复杂场景下让整个 BFF Server 更加清晰，但也相的更加复杂，需要关心更多框架层面的内容。

:::info 注
多数情况下，函数写法就能覆盖大多数 BFF 函数的定制需求。只有当你的项目服务端逻辑比较复杂，代码需要分层，或者需要使用更多框架的元素时（如 egg 插件），才需要使用框架写法。
:::

框架写法中，所有的 BFF 函数都需要写在 `api/lambda/` 目录下，并且无法使用钩子文件 `_app.[tj]s`。

### Express

Express 的框架写法支持可在 `api/app.[tj]s` 定义 API Server 的启动逻辑，执行应用的初始化工作，添加全局中间件，声明路由，甚至扩展原有框架等。

:::info 注
注意这里是 `app.[tj]s`，而不是函数写法中的钩子文件 `_app.[tj]s`。
:::

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

:::info 注
注意这里是 `app.[tj]s`，而不是函数写法中的钩子文件 `_app.[tj]s`。
:::

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
