---
title: useModuleApps
---

返回所有微前端子应用的 React 组件，用于可自由控制路由。

## 使用姿势

```tsx
import { useModuleApps } from '@modern/plugin-garfish';
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

```ts title=modern.config.js
module.exports = {
  runtime: {
    features:{
      masterApp: {
        apps: [
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
}
```

```tsx title=App.tsx
function App() {
  const { Components: { Home, Contact } } = useModuleApps();

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


## 加载动画

可以通过以下方式，自定义组件加载过程的过渡动画。

```tsx title=App.tsx
function App() {
  const { Components: { Home } } = useModuleApps();

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
