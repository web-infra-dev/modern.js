---
sidebar_position: 1
title: 如何进行代码分割
---

代码分割是优化前端资源加载的一种常用手段，本文将介绍 Modern.js 支持的三种代码分割方式：

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

## loadable

使用 `loadable` API，示例如下：

```ts
import loadable from '@modern-js/runtime/loadable'

const OtherComponent = loadable(() => import('./OtherComponent'));

function MyComponent() {
  return <OtherComponent />
}
```

`loadable` 更多用法请见 [loadable API](/docs/apis/runtime/utility/loadable/loadable_)。

:::info 注
`loadable` 开箱即用的支持 SSR。
:::

## React.lazy

React 官方提供的组件代码分割的方式，**缺点是不支持 SSR**。

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
