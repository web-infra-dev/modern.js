---
title: 静态站点生成（SSG）
sidebar_position: 4
---

SSG（Static Site Generation）是一种基于数据与模板，在构建时渲染完整静态网页的技术解决方案。

:::info 注
SSG 是构建阶段的解决方案，因此仅对生产环境有效。通过 `dev` 命令运行时，表现效果与 SSR 相同。
:::

我们首先需要执行 `pnpm run new` 启用 SSG 功能：

```bash
? 请选择你想要的操作： 启用可选功能
? 启用可选功能： 启用「SSG」功能
```

SSG 在**约定式路由**和**自控式路由**下的使用方式不同。

### 在约定式路由中使用

**约定式路由**中， Modern.js 根据入口下的文件结构生成路由，因此框架能够收集完整的路由信息。

例如，以下是一个使用约定式路由的项目目录结构：

```
.
├── src
│   └── routes
│       ├── layout.tsx
│       ├── page.tsx
│       └── user
│           ├── layout.tsx
│           ├── page.tsx
│           └── profile
│               └── page.tsx
```

上述文件目录将会生成以下三条路由：

- `/`
- `/user`
- `/user/profile`

:::note
如果还不了解约定式路由的规则，可以先查看[路由](/docs/guides/basic-features/routes)。
:::

在 `src/routes/page.tsx` 中添加组件代码：

```jsx title="src/pages/index.tsx"
export default () => {
  return  <div>Index Page</div>
}
```

SSG 也是在 Node.js 环境渲染页面，因此我们可以在**开发阶段开启 SSR**，提前在暴露代码问题，验证 SSG 渲染效果：

```typescript title="modern.config.ts"
export default defineConfig({
  server: {
    ssr: process.env.NODE_ENV === 'development',
  }
}
```

在项目根路径下执行 `pnpm run dev` 命令，查看 `dist/` 目录，此时只生成一个 HTML 文件 `main/index.html`。

在项目根路径下执行 `pnpm run build` 命令，构建完成后，查看 `dist/` 目录，此时生成 `main/index.html`、`main/user/index.html` 和 `main/user/profile/index.html` 三个 HTML 文件，内容分别对应上述三条路由。

**约定式路由**中的每一条路由，都会生成一个单独的 HTML 文件。查看 `main/index.html`，可以发现包含 `Index Page` 的文本内容，这正是 SSG 的效果。

执行 `pnpm run start` 启动项目后，访问页面，在浏览器我们工具的 Network 窗口，查看请求返回的文档，文档包含组件渲染后的完整页面内容。

### 在自控式路由中使用

**自控式路由**是通过组件代码自定义路由，需要应用运行起来才能获取准确的路由信息。因此，无法开箱即用的使用 SSG 功能。此时需要用户提前告知 Modern.js 框架，哪些路由需要开启 SSG 功能。

例如有以下代码，包含多条路由，设置 `output.ssg` 为 `true` 时，默认只会渲染入口路由即 `/`：

```tsx title="src/App.tsx"
import { useRuntimeContext } from '@modern-js/runtime';
import {
  Routes,
  Route,
  StaticRouter,
  BrowserRouter,
} from '@modern-js/runtime/router';

const Router = typeof window === 'undefined' ? StaticRouter : BrowserRouter;

export default () => {
  const { context } = useRuntimeContext();
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

如果我们希望同时开启 `/about` 的 SSG 功能，可以配置 `output.ssg`，告知 Modern.js 开启指定路由的 SSG 功能。

```typescript title="modern.config.ts"
export default defineConfig({
  output: {
    ssg: {
      routes: ['/', '/about'],
    },
  },
})
```

执行 `pnpm run build` 与 `pnpm run start` 后，访问 `http://localhost:8080/about`，在 Preview 视图中可以看到页面已经完成渲染。

查看构建产物文件，可以看到 `dist/` 目录中，新增了一个 `main/about/index.html` 文件。

:::info
以上仅介绍了单入口的情况，更多相关内容可以查看 [API 文档](/docs/configure/app/output/ssg)。
:::

### 获取数据

在 SSR 中，组件可以通过 `useLoader` 同构的获取数据。在 SSG 中，Modern.js 也提供了相同的能力。

调用 `useLoader` 时，在第二个参数中设置 `{ static: true }`，可以在 SSG 阶段执行数据的请求。

:::info 注
- Modern.js 目前还不支持 SSG 与 SSR 混合渲染，敬请期待。
- 在开发阶段，不管 `useLoader` 是否配置 `{ static: true }`，函数都会在 SSR 时获取数据。
:::

修改上述 `src/App.ts` 的代码为：

```tsx title="App.ts"
import { useRuntimeContext, useStaticLoader } from '@modern-js/runtime';
import {
  Routes,
  Route,
  StaticRouter,
  BrowserRouter,
} from '@modern-js/runtime/router';

const Router = typeof window === 'undefined' ? StaticRouter : BrowserRouter;

export default () => {
  const { context } = useRuntimeContext();

  const { data } = useStaticLoader(async () => ({
    message: Math.random(),
  }));

  return (
    <Router location={context.request.pathname}>
      <Routes>
        <Route index element={<div>index</div>} />
        <Route path="about" element={<div>about, {data?.message}</div>} />
      </Routes>
    </Router>
  );
};
```

执行 `pnpm run dev`，重复刷新页面，可以看到 `/foo` 页面的渲染结果不断发生变化，说明数据是在请求时获取的。

重新执行 `pnpm run build` 后，执行 `pnpm run start`，重复刷新页面，发现页面渲染结果始终保持同样的内容，数据在请求时不会再次获取，说明页面在编译时已经完成渲染。
