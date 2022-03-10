---
title: useModuleApp
sidebar_position: 6
---

:::info 补充信息
返回一个自动切换微前端路由的组件，默认激活的路由是配置里的 `activeWhen`。
```ts
import { useModuleApp } from '@modern-js/runtime';
```
:::

:::caution 注意
该 API 在微前端主应用中使用，需要先开启微前端。
:::

## API

`useModuleApp() => React.FC<any>`

返回子应用的 React 组件。

## 示例

需要先配置微前端子应用信息。

```js title=modern.config.js
defineConfig({
  runtime: {
    masterApp: {
      manifest: {
        modules: [
          {
            name: 'Home',
            entry: 'http://www.home.com',
            activeWhen: '/home'
          },
          {
            name: 'Contact',
            entry: 'http://www.contact.com',
            activeWhen: '/contact'
          },
        ]
      }
    }
  }
})
```

```ts title=App.tsx
import { useModuleApp } from '@modern-js/runtime';

function App() {
  const MApp = useModuleApp();

  return <MApp />;
}
```

通过 `useModuleApp()` 获取到 `MApp` 组件，渲染 MApp 组件，将会根据配置中的 `activeWhen` 作为激活路由加载对应的子应用。
