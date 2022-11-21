---
title: useContext
---

用于在一体化 BFF 函数中获取请求上下文。

## 使用姿势

根据使用的框架拓展插件，从对应的命名空间中导出：

```ts
import { useContext } from '@modern-js/runtime/{namespace}';
```

## 函数签名

`function useContext(): any`

## 示例

开发者可以通过 `context` 获取更多的请求信息，例如获取请求 UA（示例为使用 koa 框架时）：

```ts
import { useContext } from '@modern-js/runtime/koa';

export async function get() {
  const ctx = useContext();
  return ctx.req.headers['user-agent'];
}
```

:::caution 注意
只有在一体化 BFF 函数中，你才可以使用 `useContext` API 。
:::

使用不同的运行时框架时，虽然均支持 `useContext` API，但它们的返回值的类型是不同的。
