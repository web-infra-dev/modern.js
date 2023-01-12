---
title: 路由
sidebar_position: 1
---

Modern.js 内置了对 [React Router 6](https://reactrouter.com/en/main) 的**部分**支持，并提供了多种类型的路由模式。根据不同[入口](/docs/guides/concept/entries)类型，将路由分为三种模式，分别是**约定式路由**，**自控式路由**和**其他路由方案**。

:::note
本小节提到的路由，都是客户端路由，即 SPA 路由。
:::

## 约定式路由

以 `routes/` 为约定的入口，Modern.js 会自动基于文件系统，生成对应的路由结构。

Modern.js 支持了业界流行的约定式路由模式：**嵌套路由**，使用嵌套路由时，页面的路由 与 UI 结构是相呼应的，我们将会详细介绍这种路由模式。

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

### 路由文件约定

在`routes/` 目录下，目录名会作为路由 url 的映射，Modern.js 有两个文件约定 `layout.[jt]sx` 和 `page.[jt]sx`（后面简写为 `.tsx`）。这两个文件决定了应用的布局层次，其中 `layout.tsx` 中作为布局组件，`page.tsx` 作为内容组件，是整条路由的叶子节点（一条路由有且仅有一个叶子节点，且必须以叶子节点结尾）。

例如以下目录结构：

```bash
.
└── routes
    ├── page.tsx
    └── user
        └── page.tsx
```

会产出下面两条路由：

- `/`
- `/user`

当添加 `layout.tsx` 后， 假设有以下目录

:::info
这里 `routes/layout.tsx` 会作为 `/` 路由下所有组件的布局组件使用， `routes/user/layout.tsx` 会作为 `/user` 路由下所有路由组件的布局组件使用。
:::

```bash
.
└── routes
    ├── layout.tsx
    ├── page.tsx
    └── user
        ├── layout.tsx
        └── page.tsx
```

当路由为 `/` 时，会有以下 UI 布局：

```tsx
<Layout>
  <Page />
</Layout>
```

同样，`routes/user/layout.tsx` 会作为 `/user` 路由下所有组件的布局组件使用。当路由为 `/user` 时， 会有以下 UI 布局：

```tsx
<Layout>
  <UserLayout>
    <UserPage>
  <UserLayout>
</Layout>
```

#### Layout

`<Layout>` 组件是指 `routes/` 目录下所有 `layout.tsx` 文件，它们表示对应路由片段的布局，使用 `<Outlet>` 表示子组件。

```tsx title=routes/layout.tsx
import { Link, Outlet, useLoaderData } from '@modern-js/runtime/router';

export default () => {
  return (
    <>
      <Outlet></Outlet>
    </>
  );
};
```

:::note
`<Outlet>` 是 React Router 6 中新的 API，详情可以查看 [Outlet](https://reactrouter.com/en/main/components/outlet#outlet).
:::

为了方便介绍 `<Layout>` 与 `<Outlet>` 的关系，以下面的文件目录举例：

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

1. 当路由为 `/` 时，`routes/layout.tsx` 中的 `<Outlet>` 代表的是 `routes/page.tsx` 中导出的组件，生成以下 UI 结构：

```tsx
<Layout>
  <Page />
</Layout>
```

2. 当路由为 `/blog` 时，`routes/layout.tsx` 中的 `<Outlet>` 代表的是 `routes/blog/page.tsx` 中导出的组件，生成以下 UI 结构：

```tsx
<Layout>
  <BlogPage />
</Layout>
```

3. 当路由为 `/user` 时，`routes/layout.tsx` 中的 `<Outlet>` 代表的是 `routes/user/layout.tsx` 中导出的组件。`routes/user/layout.tsx` 中的 `<Outlet>` 代表的是 `routes/user/page.tsx` 中导出的组件。生成以下 UI 结构：

```tsx
<Layout>
  <UserLayout>
    <UserPage>
  <UserLayout>
</Layout>
```

总结而言，如果子路由的文件目录下存在 `layout.tsx`，上一级 `layout.tsx` 中的 `<Outlet>` 即为子路由文件目录下的 `layout.tsx` ，否则为子路由文件目录下的 `page.tsx`。

#### Page

所有的路由，理论上都应该由 `<Page>` 组件结束。在 `page.tsx` 文件内，如果开发者引入 `<Outlet>` 组件，不会有任何效果。

### 动态路由

通过 `[]` 命名的文件目录，生成的路由会作为动态路由。例如以下文件目录：

```
└── routes
    ├── [id]
    │   └── page.tsx
    ├── blog
    │   └── page.tsx
    └── page.tsx
```

`routes/[id]/page.tsx` 文件会转为 `/:id` 路由。除了可以确切匹配的 `/blog` 路由，其他所有 `/xxx` 都会匹配到该路由。

在组件中，可以通过 [useParams](/docs/apis/app/runtime/router/#useparams) 获取对应命名的参数。

在 loader 中，params 会作为 [loader](/docs/guides/basic-features/data-fetch#loader-函数) 的入参，通过 `params.xxx` 可以获取。

### 无路径布局

当目录名以 \_\_ 开头时，对应的目录名不会转换为实际的路由路径，例如以下文件目录：

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

Modern.js 会生成 `/login` 和 `/sign` 两条路由，`__auth/layout.tsx` 组件会作为 `login/page.tsx` 和 `signup/page.tsx` 的布局组件，但`__auth` 不会作为路由路径片段。

当需要为某些类型的路由，做独立的布局，或是想要将路由做归类时，这一功能非常有用。

### 无布局路径

有些情况下，项目需要较为复杂的路由，但这些路由又不存在独立的 UI 布局，如果像普通文件目录那边创建路由会导致目录层级较深。

因此 Modern.js 支持了通过 `.` 来分割路由片段，代替文件目录。例如，当需要 `/user/profile/2022/edit` 时，可以直接创建如下文件：

```
└── routes
    ├── user.profile.[id].edit
    │      └── page.tsx
    ├── layout.tsx
    └── page.tsx
```

访问路由时，将得到如下 UI 布局：

```tsx
<RootLayout>
  <UserProfileEdit /> // routes/user.profile.[id].edit/page.tsx
</RootLayout>
```

### (WIP)Loading

`routes/` 下每一层目录中，开发者可以创建 `loading.tsx` 文件，默认导出一个 `<Loading>` 组件。

当路由目录下存在该组件和 `layout` 组件时，这一级子路由下所有的路由切换时，都会以该 `<Loading>` 组件作为 JS Chunk 加载时的 Fallback UI。例如以下文件目录：

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

当定义 `loading.tsx` 时，就相当于以下布局：

```tsx title="当路由为 / 时"
<Layout>
  <Suspense fallback={<Loading/>}>
    <Page><Page>
  </Suspense>
</Layout>
```

```tsx title="当路由为 /blog 时"
<Layout>
  <Suspense fallback={<Loading />}>
    <BlogPage />
  </Suspense>
</Layout>
```

```tsx title="当路由为 /blog/123 时"
<Layout>
  <Suspense fallback={<Loading />}>
    <BlogIdPage />
  </Suspense>
</Layout>
```

:::info
当目录的 layout 组件不存在时，该目录下的 loading 组件也不会生效。
Modern.js 建议必须有根 layout 和根 loading。
:::

当路由从 `/` 跳转到 `/blog` 时，如果 `blog/page` 组件的 JS Chunk 还未加载，则会先展示 `loading.tsx` 中导出的组件 UI。

同理，当路由从 `/` 或者 `/blog` 跳转到 `/blog/123` 时，如果 `blog/[id]/page` 组件的 JS Chunk 还未加载，也会先展示 `loading.tsx` 中导出的组件 UI。

### 错误处理

`routes/` 下每一层目录中，开发者同样可以定义一个 `error.tsx` 文件，默认导出一个 `<ErrorBoundary>` 组件。

当有路由目录下存在该组件时，组件渲染出错会被 ErrorBoundary 组件捕获。当目录未定义 `layout.tsx` 文件时，`<ErrorBoundary>` 组件不会生效。

`<ErrorBoundary>` 可以返回出错时的 UI 视图，当前层级未声明 `<ErrorBoundary>` 组件时，错误会向上冒泡到更上层的组件，直到被捕获或抛出错误。同时，当组件出错时，只会影响捕获到该错误的路由组件及子组件，其他组件的状态和视图不受影响，可以继续交互。

<!-- Todo API 路由-->

在 `<ErrorBoundary>` 组件内，可以使用 [useRouteError](/docs/apis/app/runtime/router/#useparams) 获取的错误的具体信息：

```tsx
import { useRouteError } from '@modern-js/runtime/router';
const ErrorBoundary = () => {
  const error = useRouteError();
  return (
    <div>
      <h1>{error.status}</h1>
      <h2>{error.message}</h2>
    </div>
  );
};
export default ErrorBoundary;
```

### 运行时配置

在每个根 `Layout` 组件中(`routes/layout.ts`)，可以动态地定义应用运行时配置：

```ts title="src/routes/layout.tsx"
// 定义运行时配置
import type { AppConfig } from '@modern-js/runtime';

export const config = (): AppConfig => {
  return {
    router: {
      supportHtml5History: false
    }
  }
};
```

### 渲染前的钩子

在有些场景下，需要在应用渲染前做一些操作，可以在 `routes/layout.tsx` 中定义 `init` 钩子，`init` 在客户端和服务端均会执行，基本使用示例如下：

```ts title="src/routes/layout.tsx"
import type { RuntimeContext } from '@modern-js/runtime';

export const init = (context: RuntimeContext) => {
  // do something
};
```

通过 `init` 钩子可以挂载一些全局的数据，在应用的其他地方可以访问 `runtimeContext` 变量：

:::note
该功能在应用需要页面前置的数据、自定义数据注入或是框架迁移（如 Next.js）时会非常有用。
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

配合 SSR 功能时，浏览器端可以获取到 SSR 时 `init` 返回的数据，开发者可以自行判断是否要在浏览器端重新获取数据来覆盖 SSR 数据，例如：

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


## 自控式路由

以 `src/App.tsx` 为约定的入口，Modern.js 不会多路由做额外的操作，开发者可以自行使用 React Router 6 的 API 进行开发，例如：

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
在自控式路由下，开发者如果希望在 SSR 中使用 React Router 6 中 [Loader API](https://reactrouter.com/en/main/hooks/use-loader-data#useloaderdata) 的能力会相对复杂，推荐直接使用约定式路由。Modern.js 已经为你封装好了一切。
:::

## 其他路由方案

默认情况下，Modern.js 会开启内置的路由方案，即 React Router。

```js
export default defineConfig({
  runtime: {
    router: true,
  },
});
```

Modern.js 从 `@modern-js/runtime/router` 命名空间暴露了 React Router 的 API 供开发者使用，保证开发者和 Modern.js 中使用同一份代码。另外，这种情况下，React Router 的代码会被打包到 JS 产物中。如果项目已经有自己的路由方案，或者不需要使用客户端路由，可以关闭这个功能。

```js
export default defineConfig({
  runtime: {
    router: false,
  },
});
```
