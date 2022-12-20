---
title: createApp
---

用于创建自定义入口，定制运行时插件。只有在使用[自定义 App](/docs/guides/concept/entries#自定义-app) 时，才需要使用该 API。

## 使用姿势

```ts
import { createApp } from '@modern-js/runtime';
```

## 函数签名

```ts
import type { Plugin } from '@modern-js/runtime';

function createApp(options: { plugins: Plugin[] }): React.ComponentType<any>;
```

### 参数

- `options`: 可选的参数。
  - `plugins`：自定义的插件扩展。

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
    state({}),
  ]
})(App);
```
