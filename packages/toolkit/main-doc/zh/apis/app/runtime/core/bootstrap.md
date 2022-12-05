---
title: bootstrap
---

用于启动和挂载应用，通常情况下不做手动调用。只有在使用[自定义入口](/docs/guides/advanced-features/custom-app)时，才需要使用该 API。

## 使用姿势

```ts
import ReactDOM from 'react-dom/client'
import { bootstrap } from '@modern-js/runtime';

bootstrap(App, 'root', undefined, ReactDOM);
```

## 函数签名

```ts
type BootStrap<T = unknown> = (
  App: React.ComponentType,
  id: string | HTMLElement | RuntimeContext,
  root?: any,
  ReactDOM?: {
    render?: Renderer;
    hydrate?: Renderer;
    createRoot?: typeof createRoot;
    hydrateRoot?: typeof hydrateRoot;
  },
) => Promise<T>;
```

### 参数

- `AppComponent`：通过 [`createApp`](./create-app) 创建的 ReactElement 实例。
- `rootId`：要挂载的 DOM 根元素 id，如 `"root"`。
- `root`: ReactDOM.createRoot 的返回值，用于 bootstrap 函数外需要 root 销毁组件的场景。
- `ReactDOM`: ReactDOM 对象，用于区分 React 18 和 React 17 API。

## 示例

```tsx
import ReactDOM from 'react-dom/client'
import { createApp, bootstrap } from '@modern-js/runtime';
import { router, state } from '@modern-js/runtime/plugins';

function App() {
  return <div>Hello Modern.js</div>;
}

const WrappedApp = createApp({
  // 传入自定义插件
  plugins: [router({}), state({})],
})(App);

bootstrap(WrappedApp, 'root', undefined, ReactDOM);

```

:::info
由于 `@modern-js/runtime/plugins` 是别名处理的，在 ts 项目中使用时需要声明其类型， 只需要在 `src/modern-app-env.d.ts` 添加以下类型声明即可：

```ts
declare module '@modern-js/runtime/plugins';
```
:::

:::warning
bootstrap 只支持在 CSR 场景下使用。
:::
