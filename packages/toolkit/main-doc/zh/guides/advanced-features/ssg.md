---
title: 静态站点生成（SSG）
sidebar_position: 4
---

SSG（Static Site Generation）是一种基于数据与模板，在构建时渲染完整静态网页的技术解决方案。

我们首先需要执行 `pnpm run new` 启用 SSG 功能：

```bash
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用「SSG」功能
```

执行命令后，在 `modern.config.ts` 中注册 SSG 插件：

```ts title="modern.config.ts"
import ssgPlugin from '@modern-js/plugin-ssg';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  output: {
    ssg: true,
  },
  plugins: [..., ssgPlugin()],
});
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

```jsx title="src/routes/page.tsx"
export default () => {
  return <div>Index Page</div>;
};
```

SSG 也是在 Node.js 环境渲染页面，因此我们可以在**开发阶段开启 SSR**，提前在暴露代码问题，验证 SSG 渲染效果：

```ts title="modern.config.ts"
export default defineConfig({
  server: {
    ssr: process.env.NODE_ENV === 'development',
  }
}
```

在项目根路径下执行 `pnpm run dev` 命令，查看 `dist/` 目录，此时只生成一个 HTML 文件 `main/index.html`。

在项目根路径下执行 `pnpm run build` 命令，构建完成后，查看 `dist/` 目录，此时生成 `main/index.html`、`main/user/index.html` 和 `main/user/profile/index.html` 三个 HTML 文件，内容分别对应上述三条路由。

**约定式路由**中的每一条路由，都会生成一个单独的 HTML 文件。查看 `main/index.html`，可以发现包含 `Index Page` 的文本内容，这正是 SSG 的效果。

执行 `pnpm run serve` 启动项目后，访问页面，在浏览器我们工具的 Network 窗口，查看请求返回的文档，文档包含组件渲染后的完整页面内容。

### 在自控式路由中使用

**自控式路由**是通过组件代码自定义路由，需要应用运行起来才能获取准确的路由信息。因此，无法开箱即用的使用 SSG 功能。此时需要用户提前告知 Modern.js 框架，哪些路由需要开启 SSG 功能。

例如有以下代码，包含多条路由，设置 `output.ssg` 为 `true` 时，默认只会渲染入口路由即 `/`：

import SelfRouteExample from '@site-docs/components/self-route-example.md';

<SelfRouteExample />

如果我们希望同时开启 `/about` 的 SSG 功能，可以配置 `output.ssg`，告知 Modern.js 开启指定路由的 SSG 功能。

```ts title="modern.config.ts"
export default defineConfig({
  output: {
    ssg: {
      routes: ['/', '/about'],
    },
  },
});
```

执行 `pnpm run build` 与 `pnpm run serve` 后，访问 `http://localhost:8080/about`，在 Preview 视图中可以看到页面已经完成渲染。

查看构建产物文件，可以看到 `dist/` 目录中，新增了一个 `main/about/index.html` 文件。

:::info
以上仅介绍了单入口的情况，更多相关内容可以查看 [API 文档](/docs/configure/app/output/ssg)。
:::
