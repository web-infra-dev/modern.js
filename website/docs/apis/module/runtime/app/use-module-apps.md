---
title: useModuleApps
sidebar_position: 7
---

:::info 补充信息
返回所有微前端子应用的 React 组件，用于可自由控制路由。
```ts
import { useModuleApps } from '@modern-js/plugin-garfish';
```
:::

:::caution 注意
该 API 在微前端主应用中使用，需要先开启微前端。
:::

## API

`useModuleApps() => Record<string, React.FC<any>>`

分别返回包裹每个子应用后的 React 组件。

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
            entry: 'http://www.home.com'
          },
          {
            name: 'Contact',
            entry: 'http://www.contact.com'
          },
        ]
      }
    }
  }
})
```

```tsx title=App.tsx
function App() {
  const { Home, Contact } = useModuleApps();

  return <div>
    Master APP
    <Route exact path='/home'>
      <Home />
    </Route>
    <Route exact path='/home'>
      <Contact />
    </Route>
  </div>;
}
```

通过 `useModuleApps()` 获取到 `Home` 和 `Contact` 子应用组件（名称和配置里的 `name` 字段对应），之后就可以像使用普通的 React 组件一样去加载子应用。
