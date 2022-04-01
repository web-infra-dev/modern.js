---
sidebar_position: 2
title: 一体化 SSG
---

SSG（Static Site Generation）是一种基于数据与模板，在构建时渲染完整静态网页的技术解决方案。

:::info 注
SSG 是构建阶段的解决方案，因此仅对生产环境有效。通过 `dev` 命令运行时，表现效果与 SSR 相同。
:::

我们首先需要执行`pnpm run new`启用 SSG 功能：

```bash
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用「SSG」功能
```

SSG 在**约定式路由**和**自控式路由**下的使用方式不同。

### 在约定式路由中使用

**约定式路由**中， Modern.js 根据入口下的文件结构生成路由，因此框架能够收集完整的路由信息。

例如，以下是一个使用约定式路由的项目目录结构：

```
├── src/
│   ├── pages/
│   │   ├── home.tsx
│   │   ├── info.tsx
│   │   └── index.tsx
```

在 `src/pages/index.tsx` 中添加组件代码：

```jsx title="src/pages/index.tsx"
export default () => {
  return  <div>index page</div>
}
```

SSG 和 SSR 一样，也是在 Node.js 环境中完成页面渲染，因此我们可以在开发阶段开启 SSR，提前在开发阶段验证 SSG 渲染效果：

```js title="modern.config.js"
export default defineConfig({
  server: {
    ssr: process.env.NODE_ENV === 'development',
  }
}
```

在项目根路径下执行 `pnpm run dev` 命令，查看 `dist/` 目录，此时只生成一个 HTML 文件：

![vsc-alert](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/ssg-dev.png)

在项目根路径下执行 `pnpm run build` 命令，构建完成后，查看 `dist/` 目录，此时生成 `main/index.html`、`main/home/index.html` 和 `main/info/index.html` 3 个 HTML 文件，分别对应 `/`、`/home`、`/info` 3 个约定式路由，可见**约定式路由**中的每一条路由，都会生成一个单独的 HTML 文件。查看 `main/index.html`，可以发现包含 `index page` 的文本内容，这正是 SSG 的效果。

![vsc-alert](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/ssg-build.png)

执行 `pnpm run start` 启动项目后，访问页面，在浏览器我们工具的 Network 窗口，查看请求返回的文档，文档包含组件渲染后的完整页面内容。

### 在自控式路由中使用

**自控式路由**是通过组件代码自定义路由，需要应用运行起来才能获取准确的路由信息。因此，无法开箱即用的使用 SSG 功能。此时需要用户提前告知 Modern.js 框架，哪些路由需要开启 SSG 功能。

例如有以下代码：

```ts
import { Switch, Route } from '@modern-js/runtime/router';

export default () => (
  <Switch>
    <Route path="/" exact={true}>
      <div>Home</div>
    </Route>
    <Route path="/foo" exact={true}>
      <div>Foo</div>
    </Route>
  </Switch>
);
```

希望为 `/foo` 路由开启 SSG 功能，同样利用 `output.ssg` 配置。该参数允许配置页面信息，告知 Modern.js 开启指定路由的 SSG 功能。

例如上述入口中，包含两条客户端路由，分别是 `/` 和 `/foo`，设置 `output.ssg` 为 `true` 时，默认只会渲染入口路由即 `/`。如果我们希望同时开启 `/foo` 的 SSG 功能，可以这样配置：

```js title="modern.config.js"
export default defineConfig({
  output: {
    ssg: {
      routes: ['/', '/foo'],
    },
  },
})
```

执行 `pnpm run build` 与 `pnpm run start` 后，访问 `http://localhost:8080/foo`，在 Preview 视图中可以看到页面已经完成渲染。

查看构建产物文件，可以看到 `dist/` 目录中，在默认的 `main` 入口产物目录下，新增一个 `foo.html` 文件：

![vsc-alert](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/ssg-foo.png)

:::info
以上仅介绍了单入口的情况，与部分配置。更多相关内容可以查看 [API 文档](/docs/apis/config/output/ssg)。
:::

### 获取数据

在 SSR 中，组件可以通过 `useLoader` 同构的获取数据。在 SSG 中，Modern.js 也提供了相同的能力。

调用 `useLoader` 时，在第二个参数中设置 `{ static: true }`，可以在 SSG 阶段执行数据的请求。

:::info 注
- Modern.js 目前还不支持 SSG 与 SSR 混合渲染，敬请期待。
- 在开发阶段，不管 `useLoader` 是否配置 `{ static: true }`，函数都会在 SSR 时获取数据。
:::

修改上述 `App.ts` 的代码为：

```ts title="App.ts"
import { Switch, Route } from '@modern-js/runtime/router';
import { useLoader } from '@modern-js/runtime';

export default () => {
  const { data } = useLoader(
    async () => ({
      message: Math.random(),
    }),
    {
      static: true,
      params: 'foo',
    },
  );

  return (
    <Switch>
      <Route path="/" exact={true}>
        <div>Home</div>
      </Route>
      <Route path="/foo" exact={true}>
        <div>Foo, {data?.message}</div>
      </Route>
    </Switch>
  );
};
```

执行 `pnpm run dev`，重复刷新页面，可以看到 `/foo` 页面的渲染结果不断发生变化，说明数据是在请求时获取的。

重新执行 `pnpm run build` 后，执行 `pnpm run start`，重复刷新页面，发现页面渲染结果始终保持同样的内容，说明数据在请求时不会再次获取。
