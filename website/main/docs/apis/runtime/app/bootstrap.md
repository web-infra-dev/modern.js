---
title: bootstrap
sidebar_position: 8
---

:::info 补充信息
用于启动并加载应用。
```ts
import { bootstrap } from '@modern-js/runtime';
```
:::

:::tip 提示
- 只有自定义入口，即使用 `index.tsx` 而非 `App.tsx` 时，才需要使用该 API。
- 需要结合 [`createApp`](./create-app.md) 使用。
:::

## API

`bootstrap(AppComponent, rootElement) => React.ComponentType<any> | void`

### 参数

- AppComponent：`React.ComponentType<any>`，应用根组件，通过 [`createApp`](./create-app.md) 创建。
- rootElement：`string`，要挂载的 DOM 根元素 id，如 `"root"`。

## 示例

### 非 `SSR` 页面使用

```tsx
import { createApp, bootstrap } from '@modern-js/runtime';
import { router, state } from '@modern-js/runtime/plugins';
import { effects, autoActions } from '@modern-js/runtime/model';

function App() {
  return <div>Hello Modern.js</div>
}

const WrappedApp = createApp({
  // 传入自定义插件
  plugins: [
    router({}),
    state({
      plugins: [autoActions(), effects()]
    })
  ]
})(App);

bootstrap(WrappedApp, 'root'));
```

### `SSR` 页面使用

对于 `SSR` 页面，因为组件代码在浏览器端和服务端都会执行，需要通过 `typeof window !== 'undefined'` 区分环境，并暴露 `serverRender` 供服务端渲染。

```tsx
import { createApp, bootstrap } from '@modern-js/runtime';
import { router, state } from '@modern-js/runtime/plugins';
import { effects, autoActions } from '@modern-js/runtime/model';

function App() {
  return <div>Hello Modern.js</div>
}

const WrappedApp = createApp({
  // 传入自定义插件
  plugins: [
    router({}),
    state({
      plugins: [autoActions(), effects()]
    })
  ]
})(App);

if (typeof window !== 'undefined') {
  bootstrap(WrappedApp, 'root');
}

export function serverRender(context: any) {
  return bootstrap(WrappedApp, context)
}
```
