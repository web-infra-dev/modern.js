---
title: lazy
sidebar_position: 2
---

:::info
用于创建支持 [Suspense](https://reactjs.org/docs/react-api.html#reactsuspense) 的 `loadable 组件`。
```ts
import { lazy } from '@modern-js/runtime/loadable';
```
:::
## API

### lazy

```ts
import { lazy } from '@modern-js/runtime/loadable';
const OtherComponent = lazy(() => import('./OtherComponent'));
```

### lazy.lib

创建一个支持 [Suspense](https://reactjs.org/docs/react-api.html#reactsuspense) 的 `loadable 库`。

```ts
import { lazy } from '@modern-js/runtime/loadable';
const Moment = lazy.lib(() => import('moment'))
```

