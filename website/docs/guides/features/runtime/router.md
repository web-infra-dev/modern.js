---
sidebar_position: 4
title: 路由使用
---

Modern.js 集成 [React Router](https://reactrouter.com/)，通过导入 `@modern-js/runtime/router`，可以使用 React Router 的任意 API。

## 基本使用

```tsx
import {
  Redirect,
  Switch,
  Route,
  Link,
  useLocation,
} from '@modern-js/runtime/router';

function Home() {
  console.log(useLocation());

  return <div>home</div>;
}

function About() {
  console.log(useLocation());

  return <div>about</div>;
}

function App() {
  return (
    <div>
      <Link to="/home">home</Link>
      <Link to="/about">about</Link>
      <Switch>
        <Redirect exact={true} from="/" to="/home" />
        <Route path="/home">
          <Home />
        </Route>
        <Route path="/about">
          <About />
        </Route>
      </Switch>
    </div>
  );
}

export default App;
```

如上所示，我们可以使用 `Switch`、`Redirect`、`Route`、`Link` 等**组件 API**，同时也可以使用 `useLocation`、`useHistory` 等 **Hook API**。

:::info 补充信息
1. `@modern-js/runtime/router` 是基于 [react-router-dom](https://reactrouter.com/web/guides/start) 封装的，[react-router-dom](https://reactrouter.com/web/guides/start) 的所有 API，均通过 `@modern-js/runtime/router` 导入并使用。

2. Modern.js 中使用路由，不需要使用 `BrowserRouter` 或 `HashRouter` 包裹根组件。
:::

## 如何切换路由类型

路由分为 **浏览器路由** 和 **哈希路由**。Modern.js 默认启用的是浏览器路由类型，如果你想使用哈希路由，可以关闭 `supportHtml5History` 选项。

```js title="modern.config.js"
export default defineConfig({
  runtime: {
    router: {
      supportHtml5History: true,
    },
  },
});
```

除了**切换路由类型**之外，Modern.js 也支持其它路由的相关配置，更多使用请参考【[Router 配置](/docs/apis/config/runtime/router)】。
