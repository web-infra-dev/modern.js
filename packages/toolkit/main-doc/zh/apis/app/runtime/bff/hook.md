---
title: hook
---

用于在 BFF 函数写法下添加框架中间件，添加的中间件的执行会在 BFF 函数定义的路由之前。

## 使用姿势

根据使用的框架拓展插件，从对应的命名空间中导出：

```ts
import { hook } from '@modern-js/runtime/{namespace}';
```

## 函数签名

```ts
type HookOptions = {
  addMiddleware: string | function
}

function hook(options: HookOptions): void
```

### 参数

- `options`: Modern.js 提供的一系列钩子。
  - `addMiddleware`: 添加 BFF 中间件的钩子。

## 示例

使用不同的框架，应添加不同框架的中间件（示例为使用 koa 框架时）：

```ts title=api/_app.ts
import { hook } from '@modern-js/runtime/koa';

export default hook(({ addMiddleware }) => {
  addMiddleware(async (ctx, next) => {
    ctx.req.query.id = 'koa';
    await next();
  });
});
```
