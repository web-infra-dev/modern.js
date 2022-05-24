---
sidebar_position: 10
---

# createApp

:::info 补充信息
用于创建自定义入口，定制插件。
```ts
import { createApp } from '@modern-js/runtime';
```
:::

## API

`createApp(options) => React.ComponentType<any>`

### 参数

- options：`object`，可选的参数。
  - [plugins]：`Plugin[]`，自定义的插件扩展。

## 示例

### 创建自定义入口

详见 [`bootstrap`](./bootstrap.md)。

### 定制插件

```ts
import { createApp } from '@modern-js/runtime';

function App() {
  return <div>app</div>;
}

export default createApp({
  plugins: [
    router({}),
    state({
      plugins: [autoActions(), effects()]
    })
  ]
})(App)

```
