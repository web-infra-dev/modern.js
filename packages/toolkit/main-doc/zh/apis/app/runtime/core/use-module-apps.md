---
title: useModuleApps
---

返回所有微前端子应用的 React 组件，用于可自由控制路由。

## 使用姿势

```tsx
import { useModuleApps } from '@modern-js/plugin-garfish/runtime';
```

:::info 开启微前端
该 API 在微前端主应用中使用，请先执行 `pnpm run new` 开启微前端功能。

```bash
pnpm run new
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用「微前端」模式
```
:::

## 函数签名

`function useModuleApps(): Record<string, React.FC<any>>`

分别返回包裹每个子应用后的 React 组件。

## 示例

需要先配置微前端子应用信息。
import EnableMicroFrontend from '@site-docs/components/enable-micro-frontend.md';

<EnableMicroFrontend />


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

defineConfig(App, {
  masterApp: {
    apps: [
      {
        // name 区分大小写，name 提供的是什么 useModuleApps 返回的就是什么
        name: "Home",
        entry: "http://127.0.0.1:8081/"
      },
      {
          name: "Contact",
          entry: "http://localhost:8082"
      }
    ]
  }
})
```

通过 `useModuleApps()` 获取到 `Home` 和 `Contact` 子应用组件（名称和配置里的 `name` 字段对应），之后就可以像使用普通的 React 组件一样去加载子应用。


### 集中式路由

**集中式路由** 是将子应用的激活路由集中配置的方式。我们给子应用列表信息添加 `activeWhen` 字段来启用 **集中式路由**。


<MicroRuntimeConfig />

然后在主应用中使用 `useModuleApp` 方法获取 `MApp` 组件, 并在主应用渲染 `MApp`。

```tsx title=主应用：App.tsx
import { useModuleApp } from '@modern-js/plugin-runtime';

function App() {
  const { MApp } = useModuleApps();

  return <div>
    <MApp />
  </div>
}

defineConfig(App, {
  masterApp: {
    apps: [
      {
        // name 区分大小写，name 提供的是什么 useModuleApps 返回的就是什么
        name: "Dashboard",
        activeWhen: '/dashboard',
        entry: "http://127.0.0.1:8081/"
      },
      {
        name: "TableList",
        activeWhen: '/table',
        entry: "http://localhost:8082"
      }
    ]
  }
})
```

这样启动应用后，访问 `/dashboard` 路由，会渲染 `Dashboard` 子应用，访问 `/table` 路由，会渲染 `TableList` 子应用。


## 加载动画

可以通过以下方式，自定义组件加载过程的过渡动画。

```tsx title=App.tsx
function App() {
  const { Home } = useModuleApps();

  return <div>
    Master APP
    <Route exact path='/home'>
      <Home
        loadable={{
          loading: ({ pastDelay, error }: any) => {
            if (error) {
              console.error(error);
              return <div>error: {error?.message}</div>;
            } else if (pastDelay) {
              return <div>loading</div>;
            } else {
              return null;
            }
          },
        }}
      />
    </Route>
  </div>;
}
```
