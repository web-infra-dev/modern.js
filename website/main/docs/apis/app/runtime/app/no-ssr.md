---
title: NoSSR
sidebar_position: 4
---

:::info 补充信息
被 NoSSR 包裹的内容在服务端不会进行渲染，在客户端 hydrate 阶段也不会渲染，等到整个 App mount 后便会立即渲染。
```ts
import { NoSSR } from '@modern-js/runtime/ssr';
```
:::

## API

```tsx
<NoSSR></NoSSR>
```

## 示例

下列代码中，`Time` 组件用于展示当前的时间，由于服务端渲染和客户端 hydrate 时获取到的时间是不一致的，react 就会抛出异常。针对这种情况可以使用 `NoSSR` 进行优化：

```tsx
import { NoSSR } from '@modern-js/runtime/ssr';

function Time() {
  return <NoSSR>
    <div>Time: { Date.now() }</div>
  </NoSSR>
}
```

## 使用场景

在 CSR 中，常常需要根据当前浏览器 UA，或是当前页面 URL 的某个参数的不同，来渲染不同的内容。

如果此时应用直接切换到 SSR，很有可能出现不符合预期的结果。

Modern.js 在 SSR 上下文中提供了完整的浏览器端信息，合理利用上下文信息来决定组件在服务端的渲染结果，避免出现 Jarring Render。

如果应用里有太多的判断，希望以后再使用上下文；或者不希望某些内容在服务端被渲染，可以使用 NoSSR 组件将这一部分剔除在服务端渲染外。
