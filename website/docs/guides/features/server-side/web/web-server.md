---
sidebar_position: 3
title: 定制 Web Server
---

有些开发场景下，需要定制特殊的服务端逻辑，例如用户鉴权、请求预处理、添加页面渲染骨架等，这时，可以通过对 Modern.js 内置的 Web Server 进行扩展实现相应需求。

## 创建定制 Web Server


在项目根目录执行 `pnpm run new` 命令，按照如下选择，开启「Server 自定义」功能：


```bash
? 请选择你想要的操作： 创建工程元素
? 创建工程元素： 新建「Server 自定义」源码目录
? 请选择运行时框架： Express/Koa/Egg/Nest
```

目前 Modern.js 默认支持 4 种主流的 Node.js Server 框架：[Express](https://expressjs.com/)、[Koa](https://koajs.com/)、[Egg.js](https://eggjs.org/zh-cn/)、[Nest](https://nestjs.com/)，选择运行时框架时，可根据自身偏好进行选择。

执行命令后，项目目录下会新建 `server/index.ts` 文件，自定义逻辑在这个文件中编写。

## 框架差异

由于不同框架 API 的差异性，自定义逻辑的写法也有所不同。假设有以下场景：当请求的 cookies 中包含 `login-token` 时，认为用户已登录，正常返回页面；否则返回 404 状态码。下面就以此场景为例，演示不同框架下如何实现定制 Web Server 逻辑。

:::info 注
目前 Modern.js 只支持前置中间件的扩展。
:::

### Express

```ts
import { hook } from '@modern-js/runtime/server';
import type { Request, Response, NextFunction } from 'express';

export default hook(({ addMiddleware }) => {
  addMiddleware((request: Request, response: Response, next: NextFunction) => {
    if (request.headers.cookies['login-token']) {
      return next();
    } else {
      response.status = 401;
      response.end();
    }
  });
});
```

### Koa

```ts
import { hook } from '@modern-js/runtime/server';
import type { Context, Next } from 'koa';

export default hook(({ addMiddleware }) => {
  addMiddleware(async (ctx: Context, next: Next) => {
    if (ctx.cookies['login-token']) {
      await next();
    } else {
      ctx.status = 401;
    }
  });
});
```

### Egg

Egg 添加中间件的方式与 Koa 相同。

```ts
import { hook } from '@modern-js/runtime/server';
import type { Context, Next } from 'koa';

export default hook(({ addMiddleware }) => {
  addMiddleware(async (ctx: Context, next: Next) => {
    if (ctx.cookies['login-token']) {
      await next();
    } else {
      ctx.status = 401;
    }
  });
});
```

### Nest

Nest 支持添加两种类型的内容：Express 的函数中间件和 Nest 中的 [Module](https://docs.nestjs.com/modules)。

Express 的函数中间件的添加与 Express 部分的示例相同，同时这里使用 Module 来为 Web Server 添加一条新的路由。

```ts
import { hook } from '@modern-js/runtime/server';
import { Module, Injectable, Controller, Get } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Get()
  getHello() {
    return this.catsService.getHello();
  }
}

@Injectable()
class CatsService {
  getHello(): string {
    return '<div>Hello world!</div>';;
  }
}

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
class CatsModule {}

export default hook(({ addMiddleware }) => {
  addMiddleware((request: Request, response: Response, next: NextFunction) => {
    if (request.headers.cookies['login-token']) {
      return next();
    } else {
      response.status = 401;
      response.end();
    }
  });

  addMiddleware(CatsModule);
});
```

:::info 注
Modern.js 中 Web Server 与应用是一体的，在开发调试、生产部署阶段都无需单独运维。
:::

