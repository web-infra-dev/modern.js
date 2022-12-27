---
title: pages/
sidebar_position: 3
---

Entry identifier if the application want uses file system-based routing.

When the entry is the **Pages entry** type, the files in the `pages/` directory will be analyzed to client side routing.

For example, the following directory:

```bash
.
└── src
    └── pages
        ├── about
        │   └── index.jsx
        ├── index.jsx
        └── info.jsx
```

The generated route is configured as:

```bash
[
  { path: '/', component: 'pages/index.jsx' },
  { path: '/info' component: 'pages/info.jsx' },
  { path: '/about', component: 'pages/about/index.jsx' }
]
```

Files match the following conditions will not be treated as routing files:

- suffix is not `.(j|t)sx?`.
- `.d.ts` type definition file.
- test file suffix like `.(test|spec|e2e).(j|t)sx?`.

:::tip
it is recommended to write only the routing files in the `pages/`, and write the business logic to the independent features directory outside the `pages/`. In this way, most of the files in the pages directory will be routing files, and there is no need for additional filtering rules.
:::

### Dynamic Routing

Directories or files wrapped with `[]` are considered dynamic routing.

For example the following directory structure:

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

The generated route is configured as:

```js
[
  { path: '/', component: 'pages/index.jsx' },
  { path: '/info', component: 'pages/info.jsx' },
  { path: '/:post/', component: 'pages/[post]/index.js' },
  { path: '/:post/detail' components: 'pages/[post]/detail.jsx'},
  { path: '/users/:id', components: 'pages/users/[id].jsx'}
]
```

Basis dynamic routing, it supports adding special routing suffixes `(*、?、+)`.

For example: `src/pages/users/[id]*.tsx` generate route `/users/:id*`

### Global Layout

When the entire App needs a global `layout`, it can be achieved through `pages/_app.tsx`, which as follows:

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

The above `Component` is the component to which the route is accessed.

For example the following directory structure:

```bash
.
└── pages
    ├── a
    │   ├── b
    │   │   └── index.js
    │   └── index.js
    └── index.js
```

- access `/`, the `Component` is `pages/index.js`。
- access `/a`, the `Component` is `pages/a/index.js`。
- access `/a/b`, the `Component` is `pages/a/b/index.js`。

:::tip Advantages

- preserve the state of the global layout when the page changes.
- add global css.
- handle ComponentDidCatch error
- use `defineConfig`(/docs/apis/app/runtime/app/define-config) dynamic configuration runtime.

:::

### Partial Layout

When developing an App, where sub routes under the same route may share the layout.

For this scene, Modern.js convention, when there is a `_layout.js` in the directory, the routes can shared this layout.

For example the following directory structure:

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

The Component props is the specific route, for example

- access `/a`, the `Component` is `pages/a/index.js`。
- 访问 `/a/b`, the `Component` is `pages/a/b/index.js`。

In this way, you can use `pages/a/_layout.js` to display the routing common layout in the `a` directory.

### 404 路由

The convention `pages/404.[tj]sx` is the default 404 route.

For example the following directory structure:

```bash
.
└── src
    └── pages
        ├── user.js
        ├── home.js
        ├── 404.js
```

the generated route is configured is as:

```bash
[
 { path: '/user', component: './pages/user.js'},
 { path: '/home', component: './pages/home.js' },
 { path: '*', component: './pages/404.js'}
]
```

All unmatched routes will match to `pages/404.[tj]s`。
