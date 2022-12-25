---
sidebar_position: 2
title: Writing Type
---

Runtime framework support is also an important part of **BFF**. Modern.js supports extending BFF's runtime framework through plugins, and provides a series of built-in plugins, developers can directly use the conventions and ecology of the framework.

The plugin is compatible with most of the specifications of these frameworks, and each framework needs to provide two types of ways to extend the writing of BFF functions, namely **Function Writing** and **Framework Writing**.

:::note
Whether the current `api/` directory structure is written as a framework is determined by the corresponding plugin, Modern.js don't care.
:::

## Function Writing

When the plugin considers that it is currently written as a function, it must support writing middleware in the `api/_ app.ts` to extend the BFF function.

Modern.js collects the middleware in the `api/_app.ts` and passes it to the plugin, which injects the middleware into the runtime, for example:

```ts
import { hook } from '@modern-js/runtime/server';

export default hook(({ addMiddleware }) => {
  addMiddleware(myMiddleware);
});
```

:::note
The writing of middleware for different plugins is not the same, see [Runtime Framework](/docs/guides/advanced-features/bff/frameworks) for details.
:::

## Framework Writing

Framework writing is a way of using frame structure to extend BFF functions. Compared with function writing, although frame writing can use more frame structure and make the entire BFF Server clearer in complex scenarios, it is also more complex and requires more attention to the content at the framework level.

In the framework writing method, all BFF functions need to be written in the `api/lambda/` directory, and the hook file `_app.[tj]s` cannot be used.

In most cases, the function writing method can cover the customization requirements of most BFF functions. Only when your project server level logic is more complex, the code needs to be layered, or you need to use more elements of the framework, you need to use the framework writing method.

:::note
The directory structure of different plugin frameworks is not the same, see [Runtime Frameworks](/docs/guides/advanced-features/bff/frameworks) for details.
:::

