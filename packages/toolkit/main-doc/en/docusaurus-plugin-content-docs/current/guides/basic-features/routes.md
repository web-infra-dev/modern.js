---
title: Routes
sidebar_position: 1
---

Modern.js build-in provides partial support for [React Router 6](https://reactrouter.com/en/main) and provides various types of routing modes. According to different [entry](/docs/guides/concept/entries) types, routing is divided into three modes, namely **Conventional routing**, **Self-controlled routing** and **Other**.

:::note
The routes mentioned in this section are client routes, that is, SPA routes.
:::

## Conventional routing

With `routes/` as the agreed entry, Modern.js will automatically generate the corresponding routing structure based on the file system.

Modern.js supports the popular convention routing mode in the industry: **nested routing**. When using nested routing, the routing of the page corresponds the UI structure, and we will introduce this routing mode in detail.

```
/user/johnny/profile                  /user/johnny/posts
+------------------+                  +-----------------+
| User             |                  | User            |
| +--------------+ |                  | +-------------+ |
| | Profile      | |  +------------>  | | Posts       | |
| |              | |                  | |             | |
| +--------------+ |                  | +-------------+ |
+------------------+                  +-----------------+
```

### Routing file convention

There are two file conventions in the `routes/` directory `layout.[jt]sx` and `page.[jt]sx`(abbreviated as `.tsx` later). These two files determine the layout hierarchy of the application, where `layout.tsx` is used as the layout component, and `page.tsx` is used as the content component, which is the leaf node of the entire routing table.

For example, here `routes/layout.tsx` will be used as the layout component of all components under the `/` route:

```bash
.
└── routes
    ├── layout.tsx
    ├── page.tsx
    └── user
        ├── layout.tsx
        └── page.tsx
```

When the route is `/`, there will be the following UI layout:

```tsx
<Layout>
  <Page />
</Layout>
```

Similarly, `routes/user/layout.tsx` will be used as a layout component for all components under the `/user` route. When the route is `/user`, the following UI layout will be available:

```tsx
<Layout>
  <UserLayout>
    <UserPage>
  <UserLayout>
</Layout>
```

#### Layout

`<Layout>` component refers to all `layout.tsx` files in the `routes/` directory, which represent the layout of the corresponding route segment, and use `<Outlet>` to represent sub-components.

:::note
`<Outlet>` is a new API in React Router 6, see [Outlet](https://reactrouter.com/en/main/components/outlet#outlet) for details.
:::

In order to facilitate the introduction of the relationship between `<Layout>` and `<Outlet>`, the following file directory example:

```bash
.
└── routes
    ├── blog
    │   └── page.tsx
    ├── layout.tsx
    ├── page.tsx
    └── user
        ├── layout.tsx
        └── page.tsx
```

1. When the route is `/`, `<Outlet>` in `routes/layout.tsx` represents the component exported in `routes/page.tsx`, generating the following UI structure:

```tsx
<Layout>
  <Page />
</Layout>
```

2. When the route is `/blog`, `<Outlet>` in `routes/layout.tsx` represents the component exported in `routes/blog/page.tsx`, generating the following UI structure:

```tsx
<Layout>
  <BlogPage />
</Layout>
```

3. When the route is `/user`, `<Outlet>` in `routes/layout.tsx` represents the component exported in `routes/user/layout.tsx`. `<Outlet>` in `routes/user/layout.tsx` represents the component exported in `routes/user/page.tsx`. Generate the following UI structure:

```tsx
<Layout>
  <UserLayout>
    <UserPage>
  <UserLayout>
</Layout>
```

In summary, if there is a `layout.tsx` in the file directory of the subroute, the `<Outlet>` in the previous `layout.tsx` is the `layout.tsx` under the file directory of the subroute, otherwise it is the `page.tsx` under the file directory of the subroute.

#### Page

All routes should end with the `<Page>` component. In the `page.tsx` file, if the developer introduces the `<Outlet>` component, it will have no effect.

### Dynamic routing

With a file directory named `[]`, the generated route will be used as a dynamic route. For example the following file directory:

```
└── routes
    ├── [id]
    │   └── page.tsx
    ├── blog
    │   └── page.tsx
    └── page.tsx
```

The `routes/[id]/page.tsx` file is converted to the `/:id` route. Except for the `/blog` route that exactly matches, all other `/xxx` will match this route.

In component, you can get the corresponding named parameters through [useParams](/docs/apis/app/runtime/router/#useparams).

### Layout with No Path

When a directory name begins with `__`, the corresponding directory name is not converted to the actual routing path, such as the following file directory:

```
.
└── routes
    ├── __auth
    │   ├── layout.tsx
    │   ├── login
    │   │   └── page.tsx
    │   └── signup
    │       └── page.tsx
    ├── layout.tsx
    └── page.tsx
```

Modern.js will generate two routes, `/login` and `/sign`, `__auth/layout.tsx` component will be used as the layout component of `login/page.tsx` and `signup/page.tsx`, but `__auth` will not be used as the route path fragment.

This feature is useful when you need to do separate layouts for certain types of routes, or when you want to categorize routes.

### No Layout

In some cases, the project needs more sophisticated routes, but these routes do not have independent UI layouts. If you create a route like a normal file directory, the directory level will be deeper.

Therefore Modern.js supports splitting routing fragments by `.` instead of file directory. For example, when you need `/user/profile/2022/edit`, you can directly create the following file:

```
└── routes
    ├── user.profile.[id].edit
    │      └── page.tsx
    ├── layout.tsx
    └── page.tsx
```

When accessing a route, you will get the following UI layout:

```tsx
<RootLayout>
  <UserProfileEdit /> // routes/user.profile.[id].edit/page.tsx
</RootLayout>
```

### (WIP)Loading

In each layer directory under `routes/`, developers can create `loading.tsx` files and export a `<Loading>` component by default.

When the component exists in the routing directory, all routing switches under this level of subrouting will use the `<Loading>` component as the Fallback UI when JS Chunk is loaded. When the `layout.tsx` file is not defined in this directory, the `<Loading>` component will not take effect. For example, the following file directory:

```bash
.
└── routes
    ├── blog
    │   ├── [id]
    │   │   └── page.tsx
    │   └── page.tsx
    ├── layout.tsx
    ├── loading.tsx
    └── page.tsx
```

When a route jumps from `/` to `/blog`, if the JS Chunk of the `<Blog>` component is not loaded, the component UI exported in `loading.tsx` will be displayed first. But when jumping from `/blog` to `/blog/20220101`, it will not be displayed.

### ErrorBoundary

In each layer directory under `routes/`, the developer can also define a `error.tsx` file, and export a `<ErrorBoundary>` component by default.

When the component exists in a routing directory, the component render error is caught by the `ErrorBoundary` component. The `<ErrorBoundary>` component does not take effect when the directory does not have a `layout.tsx` file defined.

`<ErrorBoundary>` can return the UI view when the error occurred. When the `<ErrorBoundary>` component is not declared at the current level, the error will bubble up to the higher component until it is caught or throws an error. At the same time, when a component fails, it will only affect the routed component and sub-component that caught the error. The state and view of other components are not affected and can continue to interact.

<!-- Todo API 路由-->

Within the `<ErrorBoundary>` component, you can use [useRouteError](/docs/apis/app/runtime/router/#useparams) to get the specific information of the error:

```tsx
import { useRouteError } from '@modern-js/runtime/router';
export default const ErrorBoundary = () => {
  const error = useRouteError();
  return (
    <div>
        <h1>{error.status}</h1>
        <h2>{error.message}</h2>
    </div>
  )
}
```

### Hooks before rendering

In some scenarios where you need to do some operations before the application renders, you can define `init` hooks in `routes/layout.tsx`. `init` will be executed on both the client and server side, the basic usage example is as follows:

```ts title="src/routes/layout.tsx"
import type { RuntimeContext } from '@modern-js/runtime';

export const init = (context: RuntimeContext) => {
  // do something
};
```

The `init` hook allows you to mount some global data and access the `runtimeContext` variable from elsewhere in the application:

:::note
This feature is useful when the application requires pre-page data, custom data injection or framework migration (e.g. Next.js)
:::

```ts title="src/routes/layout.tsx"
import {
  RuntimeContext,
} from '@modern-js/runtime';

export const init = (context: RuntimeContext) => {
  return {
    message: 'Hello World',
  }
}
```

```tsx title="src/routes/page.tsx"
import { useRuntimeContext } from '@modern-js/runtime';

export default () => {
  const { context } = useRuntimeContext();
  const { message } = context.getInitData();

  return <div>{message}</div>;
}
```

When working with SSR, the browser side can get the data returned by `init` during SSR, and the developer can decide whether to retrieve the data on the browser side to overwrite the SSR data, for example:

```tsx title="src/routes/layout.tsx"
import {
  RuntimeContext,
} from '@modern-js/runtime';

export const init = (context: RuntimeContext) => {
  if (process.env.JUPITER_TARGET === 'node') {
    return {
      message: 'Hello World By Server',
    }
  } else {
    const { context } = runtimeContext;
    const data = context.getInitData();
    // 如果没有获取到期望的数据
    if (!data.message) {
      return {
        message: 'Hello World By Client'
      }
    }
  }
}
```

### Runtime Configuration

In each root `Layout` component (`routes/layout.ts`), the application runtime configuration can be dynamically defined:

```ts title="src/routes/layout.tsx"
import type { AppConfig } from '@modern-js/runtime';

export const config = (): AppConfig => {
  return {
    router: {
      supportHtml5History: false
    }
  }
};
```

## Self-controlled routing

With `src/App.tsx` as the agreed entry, Modern.js will not do additional operations with multiple routes, developers can use the React Router 6 API for development by themselves, for example:

```tsx
import { Route, Routes, BrowserRouter } from '@modern-js/runtime/router';
import { StaticRouter } from '@modern-js/runtime/router/server';

const Router = typeof window === 'undefined' ? StaticRouter : BrowserRouter;
export default () => {
  return (
    <Router location={context.request.pathname}>
      <Routes>
        <Route index element={<div>index</div>} />
        <Route path="about" element={<div>about</div>} />
      </Routes>
    </Router>
  );
};
```

:::note
Under self-controlled routing, if developers want to use the [Loader API](https://reactrouter.com/en/main/hooks/use-loader-data#useloaderdata) capabilities in React Router 6 in SSR will be relatively complicated, it is recommended to use conventional routing directly. Modern.js has already encapsulated everything for you.
:::

## Other

By default, Modern.js turn on the built-in routing scheme, React Router.

```js
export default defineConfig({
  runtime: {
    router: true,
  },
});
```

Modern.js exposes the React Router API from the `@modern-js/runtime/router` namespace for developers to use, ensuring that developers and Modern.js use the same code. In addition, in this case, the React Router code will be packaged into JS products. If the project already has its own routing scheme, or does not need to use client routing, this feature can be turned off.

```js
export default defineConfig({
  runtime: {
    router: false,
  },
});
```
