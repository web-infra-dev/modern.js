---
title: 代码分割
sidebar_position: 6
---

代码分割是优化前端资源加载的一种常用手段，本文将介绍 Modern.js 支持的三种代码分割方式：

:::info
使用 Modern.js [约定式路由](/docs/guides/basic-features/routes#约定式路由)时，默认会根据路由组件做代码分割，包裹 `Suspense` 组件，无需自行进行代码分割。
:::

- `import`
- `React.lazy`
- `loadable`

## import

使用动态 `import()` 语法，`import` 接收的 JS 模块将作为一个新的打包入口被打包到单独的 JS 文件中。例如：

```ts
import("./math").then(math => {
  console.log(math.add(16, 26));
});
```

`./math` 路径对应的 JS 模块会被打包到单独的 JS 文件中。

## React.lazy

React 官方提供的组件代码分割的方式。

:::caution
React 17 及以下版本不支持 SSR，建议 React17 的 SSR 应用使用 loadable。
:::

```ts
import React, { Suspense } from 'react';

const OtherComponent = React.lazy(() => import('./OtherComponent'));
const AnotherComponent = React.lazy(() => import('./AnotherComponent'));

function MyComponent() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <section>
          <OtherComponent />
          <AnotherComponent />
        </section>
      </Suspense>
    </div>
  );
}
```

`React.lazy` 更多用法请见 [React lazy](https://zh-hans.reactjs.org/docs/code-splitting.html#reactlazy)。

## loadable

使用 `loadable` API，示例如下：

```ts
import loadable from '@modern-js/runtime/loadable'

const OtherComponent = loadable(() => import('./OtherComponent'));

function MyComponent() {
  return <OtherComponent />
}
```

`loadable` 更多用法请见 [loadable API](/docs/apis/app/runtime/utility/loadable)。

:::info 注
`loadable` 开箱即用的支持 SSR，但不支持和 Suspense 一起使用，如果是 CSR 项目可以使用 [loadable.lazy](https://loadable-components.com/docs/suspense/)
:::
