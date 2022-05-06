---
title: api/app.[tj]s
sidebar_position: 2
---

Modern.js 框架写法下，该文件可以定制 API Server 的启动逻辑。在使用 `express`, `nest`, `koa` 时，该文件返回对应框架的实例。
在使用 `egg` 框架时，该文件返回一个 Boot 类；与 `egg` 框架自身的[约定](https://eggjs.org/zh-cn/basics/app-start.html)相同。

以下为简单示例：

## [Express](https://expressjs.com/)

```ts
import express from 'express'

const app = express();

app.put('/user', function (req, res) {
  res.send('Got a PUT request at /user')
})

app.use(async (req, res, next) => {
    console.info(`access url: ${req.url}`);
    next();
});
export default app
```

## [Nest](https://nestjs.com/)

Nest 虽然有定制的启动器，但本质与 Express、Koa 相同，所以 MWA 沿用了 Nest 定制启动器的默认入口：`api/main.ts`。

按照 Nest 官方生成器生成的项目结构，在 MWA 中使用 Nest 框架写法时，目录结构为：

```markdown
api
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── lambda
│   └── hello.ts
└── main.ts
```

其中 `api/main.ts` 中的内容与 Nest 官方生成器生成模版有所不同，MWA 中支持了两种模式：

不包含内置 Module：

```ts
import { defineCustom } from '@modern-js/plugin-nest';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { AppModule } from './app.module';

export default NestFactory.create(AppModule);
```

包含内置 Module：

```ts
import { defineCustom } from '@modern-js/plugin-nest';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { AppModule } from './app.module';

export default defineCustom(async modules => {
  @Module({
    imports: [AppModule, ...modules],
  })
  class MainModule {}

  return NestFactory.create(MainModule);
});
```

## [Koa](https://koajs.com/)

:::caution 注意
当没有 `app.ts` 的时候，Modern.js 默认会添加 `koa-body`；当有 `app.ts` 时，需要你自己添加 `koa-body` 解析请求体。
:::

```ts
import Koa from 'koa'
import koaBody from 'koa-body'

const app = new Koa();
app.use(async (ctx, next) => {
  console.info(`access url: ${ctx.url}`);
  await next();
});

app.use(koaBody());

export default app;
```

## [Egg](https://eggjs.org/)

使用 Egg 框架时，同样在这个文件中可以自定义启动逻辑；
但与其他框架不同，egg 中此文件遵循 egg 自身的[规范](https://eggjs.org/zh-cn/basics/app-start.html)，而不是 Modern.js 的约定。
