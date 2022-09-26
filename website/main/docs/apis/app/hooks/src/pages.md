---
title: src/pages/, src/[entry]/pages/
sidebar_position: 2
---

应用项目基于文件系统路由的入口标识。

当项目结构为 `Pages 入口` 类型时， 会分析 `src/pages` 目录下的文件得到客户端路由配置。


举例说明，例如以下目录结构：

```bash
.
└── src
    └── pages
        ├── about
        │   └── index.jsx
        ├── index.jsx
        └── info.jsx
```

对应生成的路由配置为:

```bash
[
  { path: '/', component: 'pages/index.jsx' },
  { path: '/info' component: 'pages/info.jsx' },
  { path: '/about', component: 'pages/about/index.jsx' }
]
```

pages 目录下的文件满足以下条件的不会被当做路由文件

- 后缀不是 `.(j|t)sx?` 的文件。
- `.d.ts` 类型定义文件。
- 以 `.(test|spec|e2e).(j|t)sx?` 结尾的测试文件。

:::tip 提示

推荐 pages 目录下只写入口代码，把业务逻辑写到 pages 外面独立的 features 目录里。这样 pages 目录下大部分文件都会是路由文件，也就不需要额外的过滤规则。

:::

### 动态路由

使用 `[ ]` 包裹的目录或文件会被视为动态路由

例如以下目录结构:

```bash
.
└── src
    └── pages
        ├── [post]
        │   ├── detail.jsx
        │   └── index.js
        ├── users
        │   └── [id].jsx
        ├── index.jsx
        └── info.jsx
```

对应生成的路由配置为:

```js
[
  { path: '/', component: 'pages/index.jsx' },
  { path: '/info', component: 'pages/info.jsx' },
  { path: '/:post/', component: 'pages/[post]/index.js' },
  { path: '/:post/detail' components: 'pages/[post]/detail.jsx'},
  { path: '/users/:id', components: 'pages/users/[id].jsx'}
]
```

动态路由的基础上，支持添加特殊的路由后缀 `(*、?、+)`。

例如：`src/pages/users/[id]*.tsx` 最终路由为 `/users/:id*`

### 全局 layout

整个应用需要全局的 `layout` 时， 可以通过 `pages/_app.tsx` 实现，具体写法如下:

```js
import React from 'react';
import UserLayout from 'xxxx';

export default const App = ({Component, ...pageProps}:{ Component: React.ComponentType}) => {
  return (
    <UserLayout>
      <Component {...pageProps} />
    </UserLayout>
  );
}
```

上述 `App` 为访问具体路由匹配到的组件。

例如以下目录结构:

```bash
.
└── pages
    ├── a
    │   ├── b
    │   │   └── index.js
    │   └── index.js
    └── index.js
```

- 访问 `/` 时，对应的 `Component` 组件为 `pages/index.js`。
- 访问 `/a` 时，对应的 `Component` 组件为 `pages/a/index.js`。
- 访问 `/a/b` 时，对应的 `Component` 组件为 `pages/a/b/index.js`。

:::tip 全局 layout 有以下优点

- 页面变化时，保留全局布局的状态
- 添加全局样式
- ComponentDidCatch 错误处理
- 使用 `defineConfig`(/docs/apis/runtime/app/define-config) 动态配置运行时配置。

:::

### 部分 layout

开发应用时，存在同一路由下的子路由共用 layout 的场景。

针对这一场景，Modern.js 约定，当目录下存在 `_layout.js` ，就会有类似全局 layout 的效果。

例如以下目录结构:

```bash
└── pages
    ├── a
    │   ├── b
    │   │   └── index.js
    │   ├── _layout.js
    │   └── index.js
    └── index.js
```

```js title="pages/a/_layout.js"
import React from 'react';

const ALayout = ({ Component, ...pageProps }) => {
  return <Component {...pageProps} />;
};
export default ALayout;
```

Component 参数为访问具体路由对应的组件，例如

- 访问 `/a` 时，对应的 `Component` 组件为 `pages/a/index.js`。
- 访问 `/a/b` 时，对应的 `Component` 组件为 `pages/a/b/index.js`。

这样就可以用 `pages/a/_layout.js` 满足 `a` 目录下路由共用 layout 的需求。

### 404 路由

约定 `pages/404.[tj]sx` 为默认的 404 路由。

例如以下目录结构:

```bash
.
└── src
    └── pages
        ├── user.js
        ├── home.js
        ├── 404.js
```

生成路由配置如下:

```bash
[
 { path: '/user', component: './pages/user.js'},
 { path: '/home', component: './pages/home.js' },
 { path: '*', component: './pages/404.js'}
]
```

所有未匹配的路由，都将匹配到 `pages/404.[tj]s`。
