---
sidebar_position: 1
---

# useContext

:::info 补充信息
用于在一体化 BFF 函数中获取请求上下文。
```ts
import { useContext } from '@modern-js/runtime/server';
```
:::

## API

`useContext() => any`

## 示例

开发者可以通过 `context` 获取更多的请求信息，例如获取请求 UA(示例为使用 koa 框架时)：

```ts
import { useContext } from '@modern-js/runtime/server';

export async function get() {
  const ctx = useContext();
  return ctx.req.headers['user-agent'];
}
```

:::caution 注意
只有在一体化 BFF 函数中，你才可以使用 `useContext` API 。
:::


## 框架差异

在 Modern.js 中 **Express**、**Nest**、**Koa**、**Egg** 等运行时框架均支持 `useContext` API，但它们的返回值的类型是不同的。

### Express

```ts
import { Request, Response } from 'express';

export type Context = { req: Request; res: Response };
```

### Nest

```ts
import type { Request, Response } from 'express';
import type { FastifyRequest } from 'fastify';

export type Context = {
  request: Request & FastifyRequest;
  response: Response;
};
```

### Koa

```ts
export type { Context } from 'koa';
```

### Egg

```ts
export type { Context } from 'egg';
```
