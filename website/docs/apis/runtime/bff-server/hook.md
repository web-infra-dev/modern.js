---
sidebar_position: 3
---

# hook

:::info 补充信息
用于在 BFF 函数写法下添加框架中间件，添加的中间件的执行会在**BFF函数**定义的路由之前。
```ts
import { hook } from '@modern-js/runtime/server';
```
:::

## API

`hook(options) => void`

### 参数

- options: `object`，Modern.js 提供的一系列钩子。
  - [addMiddleware]: `string | function`，添加中间件的钩子。

## 示例

使用不同的框架，应添加不同框架的中间件。目前支持 **express**、**nest**、**koa** 和 **egg**。
### Express

```ts title=api/_app.ts
import { hook } from '@modern-js/runtime/server';

export default hook(({ addMiddleware }) => {
  addMiddleware(async (req, res, next) => {
    req.query.id = 'express';
    await next();
  });
});
```

### Nest

#### 添加中间件

```ts title=api/_app.ts
import { hook } from '@modern-js/runtime/server';

export default hook(({ addMiddleware }) => {
  addMiddleware(async (req, res, next) => {
    req.query.id = 'express';
    await next();
  });
});
```

#### 添加 Module

```ts title=api/_app.ts
import { hook } from '@modern-js/runtime/server';
import {
  Injectable,
  MiddlewareConsumer,
  Module,
  NestMiddleware,
} from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  async use(req: any, res: any, next: any) {
      console.info(`access url: ${req.url}`);
      next();
  }
}

@Module()
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

export default hook(({ addMiddleware }) => {
  addMiddleware(AppModule);
});
```

### Koa

```ts title=api/_app.ts
export default hook(({ addMiddleware }) => {
  addMiddleware(async (ctx, next) => {
    ctx.req.query.id = 'koa';
    await next();
  });
});
```

### egg

#### 添加中间件

```ts title=api/_app.ts
export default hook(({ addMiddleware }) => {
  addMiddleware(() => async (ctx, next) => {
    ctx.req.query.id = 'egg';
    await next();
  });
});
```

#### 给中间件注入参数

```ts title=api/_app.ts
export default hook(({ addMiddleware }) => {
  addMiddleware([
    'eggMiddleware',        // 这里为第三方 node_module 包名
    {
      key: 'value',
    },
  ])
});
```
