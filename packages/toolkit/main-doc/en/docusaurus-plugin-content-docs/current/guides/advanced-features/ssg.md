---
title: Static Site Generation
sidebar_position: 4
---

Static Site Generation is a solution for rendering complete static web pages at build time based on data and templates.

First need to execute `pnpm run new` to enable the SSG features:

```bash
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用「SSG」功能
```

After execute script，register SSG plugin in `modern.config.ts`:

```ts title="modern.config.ts"
import SSGPlugin from '@modern-js/plugin-ssg';
// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  ...,
  plugins: [..., SSGPlugin()],
});
```

SSG in **Conventional Routing** and **Self-control Routing** has different usage.

### Conventional Routing

Modern.js generate routes based on the file structure under the entry, so the framework can collect complete routing information.

For example, the following is a project directory structure using conventional routing:

```bash
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

The above file directory will generate the following three routes:

- `/`
- `/user`
- `/user/profile`

:::note
If you don't know the rules for routing, you can first check [routes](/docs/guides/basic-features/routes).
:::

add component to `src/routes/page.tsx`：

```jsx title="src/routes/page.tsx"
export default () => {
  return  <div>Index Page</div>
}
```

SSG is also render in Node.js. So we can enable SSR in developmenet env, expose code problems in advance and verify SSG rendering effect：

```typescript title="modern.config.ts"
export default defineConfig({
  server: {
    ssr: process.env.NODE_ENV === 'development',
  }
}
```

Execute the `pnpm run dev` command in the project to view the `dist/` directory, and only generate an HTML file `main/index.html`.

Execute the `pnpm run build` command in the root path of the project. After the construction is completed, view the `dist/` directory, and generate `main/index.html`, `main/user/index.html` and `main/user/profile/index.html` three HTML files, the content corresponds to the above three routes.

Using **Conventional Routing**, each route will generate a HTML file. Looking at the `main/index.html`, we can find the text content containing the `Index Page`, which is exactly the effect of SSG.

After executing `pnpm run serve` to start the project, visit the page in the Network, view the document returned by the request. The document contains the complete page content rendered by the component.

### Self-control Routing

**Self-controlled routing** is a custom routing through component code, which requires the application to run to obtain accurate routing information. Therefore, the SSG function cannot be used out of the box. At this time, the user needs to inform the Modern.js framework in advance which routes need to enable the SSG.

For example, there is the following code, which contains multiple routes. When setting `output.ssg` to `true`, only the entry route '/' will be rendered by default:

```tsx title="src/App.tsx"
import { useRuntimeContext } from '@modern-js/runtime';
import { Routes, Route, BrowserRouter } from '@modern-js/runtime/router';
import { StaticRouter } from '@modern-js/runtime/router/server';

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

If we want to enable the SSG of `/about` at the same time, we can configure the `output.ssg` to tell Modern.js to enable the SSG of the specified route.

```typescript title="modern.config.ts"
export default defineConfig({
  output: {
    ssg: {
      routes: ['/', '/about'],
    },
  },
})
```

run `pnpm run build` and `pnpm run serve`，access `http://localhost:8080/about`. In the Preview view, you can see that the page has been rendered。

Looking at the bundle file, a new `main/about/index.html` file has been added in the `dist/` directory.

:::info
The above only introduces the single entry, more related content can be viewed [SSG API](/docs/configure/app/output/ssg)。
:::

