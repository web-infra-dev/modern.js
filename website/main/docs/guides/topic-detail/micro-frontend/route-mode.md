---
sidebar_position: 4
title: 加载子应用
---

在微前端中分为两种加载子应用的方式：

1. **子应用组件** 获取到每个子应用的组件，之后就可以像使用普通的 React 组件一样渲染微前端的子应用。
2. **集中式路由** 通过集中式的路由配置，自动根据当前页面 pathname 激活渲染对应的子应用。

## 子应用组件

使用 `useModuleApps` API 可以获取到各个子应用的组件。结合 `router`，可以自控式的根据不同的路由渲染不同的子应用。

假设我们的子应用列表配置如下：

```js title="modern.config.js"
export default defineConfig({
  runtime: {
    masterApp: {
      manifest: {
        modules: [
          {
            name: "Dashboard",
            entry: "http://localhost:8081"
          },
          {
            name: "TableList",
            entry: "http://localhost:8082"
          }
        ]
      }
    }
  }
}
```

编辑主应用 `App.tsx` 文件如下：

```tsx title=主应用：App.tsx
import { useModuleApps } from '@modern-js/plugin-garfish';
import { Route, Switch } from '@modern-js/runtime/router';

function App() {
  const { Dashboard, TableList } = useModuleApps();

  return <div>
    <Switch>
      <Route path='/dashboard'>
        <Dashboard />
      </Route>
      <Route path='/tablelist'>
        <TableList />
      </Route>
    </ Switch>
  </div>
}
```

这里通过 `Route` 组件自定义了 **DashBoard** 的激活路由为 **/dashboard**， **TableList** 的激活路由为 **/tablelist**。

## 集中式路由

**集中式路由** 是将子应用的激活路由集中配置的方式。我们给子应用列表信息添加 `activeWhen` 字段来启用 **集中式路由**。

```js title="modern.config.js"Å {8,13}
export default defineConfig({
  runtime: {
    masterApp: {
      manifest: {
        modules: [
          {
            name: "Dashboard",
            activeWhen: '/dashboard',
            entry: "http://localhost:8081"
          },
          {
            name: TableList,
            activeWhen: '/tablelist',
            entry: "http://localhost:8082"
          }
        ]
      }
    }
  }
}
```

然后在主应用中使用 `useModuleApp` API 来获取 `MApp` 在主应用渲染。

```tsx title=主应用：App.tsx
import { useModuleApp } from '@modern-js/runtime';

function App() {
  const MApp = useModuleApp();

  return <div>
    <MApp />
  </div>
}
```

这样启动应用后，访问 `/dashboard` 路由，会渲染 `Dashboard` 子应用，访问 `/tablelist` 路由，会渲染 `TableList` 子应用。

## 两种模式混用

当然 **子应用组件** 和 **集中式路由** 是可以混合使用的。

- 一部分子应用作为 **子应用组件** 激活，另外一部分作为 **集中式路由** 激活。
- 一部分子应用既可以作为 **集中式路由** 激活，也可以作为 **子应用组件** 激活。
