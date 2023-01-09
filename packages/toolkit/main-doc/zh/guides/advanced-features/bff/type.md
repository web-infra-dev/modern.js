---
sidebar_position: 2
title: 函数写法 & 框架写法
---

运行时框架支持也是 **BFF** 中重要的一环。Modern.js 支持通过插件扩展 BFF 的运行时框架，并提供了一系列内置插件，开发者可以直接使用对应框架的约定和生态。

插件中兼容了这些框架大部分的规范，每一种框架都需要提供两类扩展写法 BFF 函数的方式，分别是**函数写法**和**框架写法**。

:::note
当前 `api/` 目录结构是否为框架写法由对应的插件决定，Modern.js 并不关心。
:::

## 函数写法

当插件认为当前为函数写法时，必须支持在 `api/_app.ts` 中编写中间件，用来扩展 BFF 函数。

Modern.js 会收集 `api/_app.ts` 中的中间件，并传递给插件，由插件将中间件注入运行时，例如：

```ts
import { hook } from '@modern-js/runtime/server';

export default hook(({ addMiddleware }) => {
  addMiddleware(myMiddleware);
});
```

:::note
不同插件的中间件的写法不一定相同，详情可见[运行时框架](/docs/guides/advanced-features/bff/frameworks)。
:::

## 框架写法

框架写法是一种使用框架结构来扩展 BFF 函数的方式。和函数写法相比，框架写法虽然能够利用更多框架的结构，在复杂场景下让整个 BFF Server 更加清晰，但也相的更加复杂，需要关心更多框架层面的内容。

框架写法中，所有的 BFF 函数都需要写在 `api/lambda/` 目录下，并且无法使用钩子文件 `_app.[tj]s`。

多数情况下，函数写法就能覆盖大多数 BFF 函数的定制需求。只有当你的项目服务端逻辑比较复杂，代码需要分层，或者需要使用更多框架的元素时，才需要使用框架写法。

:::note
不同插件框架写法的目录结构不一定相同，详情可见[运行时框架](/docs/guides/advanced-features/bff/frameworks)。
:::
