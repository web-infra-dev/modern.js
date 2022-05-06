---
sidebar_position: 1
title: 定义路由
---

Modern.js 在运行时是一个 **Universal App（大统一应用）**——— 既有客户端部分，又有服务端部分。但是开发者对服务端部分是无感知的，不需要专门去为 Server 部分编写代码，只需要专注产品本身的业务逻辑开发即可。

使用 Modern.js，开发者无需像传统的以服务端为中心的框架那样，手动定义路由映射关系。Modern.js 会自动为每一个[入口](/docs/guides/tutorials/c07-app-entry/7.1-intro) 生成一个 **服务端路由**。同时，在每一个入口下，开发者还可以定义 **客户端路由**，使每一个入口都成为一个独立的单页 Web 应用( SPA )。

## 服务端路由

服务端路由是由 Modern.js 根据入口以及配置生成的路由。Modern.js 会根据基于文件约定的**标识**，自动生成入口。Modern.js 支持3种**标识**：

- [`App.[tj]sx` 文件](/docs/apis/hooks/mwa/src/app)
- [`pages/` 目录](/docs/apis/hooks/mwa/src/pages)
- [`index.[tj]sx` 文件](/docs/apis/hooks/mwa/src/index)

当 `src/` 目录下有**入口标识**，就认为这个应用是单入口的，`src/` 下的其他文件和目录，都会被视为入口内部的文件。

如果 `src/` 目录下没有**入口标识**，那么 `src/` 目录的**下一级**目录里，如果有**入口标识**，这个目录就会被视为一个应用入口，这个目录下的其他文件和目录，都会被视为入口内部的文件。


例如，以下目录结构：

```
.
├── src/
│   ├── .eslintrc.json
│   ├── App.css
│   └── App.tsx
```

`src/` 目录下包含 `App.tsx` 这个**入口标识**，将会生成一个单入口应用，对应的服务端路由为根路径 `/`。

而以下目录结构：

```
.
├── src/
│   ├── contacts/
│   │   ├── App.css
│   │   └── App.tsx
│   ├── landing-page/
│   │   ├── App.css
│   │   └── App.tsx
│   └── .eslintrc.json
```

`src/contacts/` 和 `src/landing-page/` 目录下包含 `App.tsx` 这个**入口标识**，将会生成由入口名为 `contacts` 和 `landing-page` 组成的多入口应用，两个入口对应的服务端路由分别为 `/contacts` 和 `/landing-page`。

:::info 注
当**入口名**和**项目名**（`package.json` 里的 `name`）相同时，会被认为是应用主入口，对应的服务端路由为根路径 `/`，即主入口对应的服务端路由不需要包含**入口名**这部分路径。
:::

:::info 补充信息
可以通过配置项【[server.routes](/docs/apis/config/server/routes)】来修改默认生成的服务端路由。
:::

## 客户端路由

Modern.js 的客户端路由基于 [React Router](https://reactrouter.com/) 实现，支持**自控式路由**和**约定式路由**两种写法。

:::tip 提示
使用客户端路由，需要先确认 [`runtime.state`](/docs/apis/config/runtime/state) 配置已开启。
:::

### 自控式路由

使用 `App.jsx` 作为**入口标识**的入口，需要使用**自控式路由**。此时，开发人员需要手动引入 `Route` 等路由组件定义路由，下面是一个示例：

```tsx title="App.tsx"
import { Switch, Route } from '@modern-js/runtime/router'

export default () => (
  <Switch>
    <Route path="/" exact={true}>
      <div>Hello Modern.js</div>
    </Route>
    <Route path="/info" exact={true}>
      <div>User info</div>
    </Route>
    <Route path="*">
      <div>404</div>
    </Route>
  </Switch>
)
```

上述代码将会生成两条客户端路由 `/` 和 `/info`，其余所有未匹配的 URL 都会返回 404。

:::tip 提示
和直接使用 React Router 不同，这里不需要在 `Route` 组件外包裹 `Router` 组件，因为 Modern.js 会自动在根组件包裹 `Router` 组件。
:::


### 约定式路由

使用 `pages/` 目录作为**入口标识**的入口，客户端路由采用的是**约定式路由**：基于 `pages/` 目录下的文件名及文件路径自动生成路由信息。

例如，下面的目录结构：

```
.
├── src/
│   ├── pages/
│   │   ├── _app.tsx
│   │   ├── docs.tsx
│   │   └── index.tsx
│   └── .eslintrc.json
```

将会自动生成 `/` 和 `/docs` 两条客户端路由，`/` 对应渲染的组件为 `index.tsx` 默认导出的组件，`/docs` 对应渲染的组件为 `docs.tsx` 默认导出的组件。`_app.tsx` 是下划线开头的文件，代表**约定式路由**中的一个特殊文件，为整个入口提供根组件，可以用于实现全局布局、公共 UI 等，详细使用请参考[这里](/docs/apis/hooks/mwa/src/pages#全局-layout)。

又例如以下多入口的情况：

```
├── src/
│   ├── contacts/
│   │   └── pages/
│   │       ├── _app.tsx
│   │       ├── docs.tsx
│   │       └── home.tsx
│   ├── landing-page/
│   │   └── pages/
│   │       ├── _app.tsx
│   │       ├── docs.tsx
│   │       └── index.tsx
│   ├── .eslintrc.json
```

`contacts` 入口生成 `/contacts/home`、`/contacts/docs` 两条路由；`landing-page` 入口生成 `/landing-page`、`/landing-page/docs` 两条路由。

