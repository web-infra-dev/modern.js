# 其他重要变更

本篇文档介绍从 Modern.js 2.0 升级到 3.0 时，其他重要的不兼容变更以及相关的迁移说明。

## 不再支持 webpack 构建

Modern.js 3.0 不再支持使用 webpack 作为构建工具，默认使用 Rspack 作为构建 bundler。Rspack 基于 Rust 实现，构建速度相比 webpack 有显著提升，同时与 webpack 配置高度兼容，大部分配置可以直接迁移。

如果你的项目之前使用了 webpack 特定的配置或插件，需要检查项目中是否有 webpack 相关的自定义配置，并确认使用的 webpack 插件是否有 Rspack 对应版本。

:::tip
Rspack 与 webpack 配置高度兼容，大部分情况下无需修改即可使用。
:::

## 入口名称变化

Modern.js 3.0 将项目默认入口名称改为 `index`，默认构建出的 HTML 文件为 `index.html`。`index.html` 是大多数 Web 服务器的默认首页文件，无需额外配置。

如果你的项目部署配置中指定了特定的入口文件名，需要更新为 `index.html`。

## API 引入路径

Modern.js 3.0 对部分运行时进行了调整，需要更新相关的导入路径。路径映射对照如下：

| 旧版路径 | 新版路径 | 说明 |
|---------|---------|------|
| `@modern-js/runtime/bff` | `@modern-js/plugin-bff/runtime` | BFF 运行时路径 |
| `@modern-js/runtime/server` | `@modern-js/server-runtime` | 服务端运行时路径 |

## 不再支持 pages 目录的约定式路由

Modern.js 3.0 不再支持 Modern.js 1.0 版本引入的 `pages` 目录的约定式路由，统一使用 `routes` 目录的约定式路由。

如果你的项目使用了 `pages` 目录，需要将 `src/pages` 目录重命名为 `src/routes`，并更新项目中所有引用 `pages` 目录的导入路径。详细迁移步骤请参考 [约定式路由文档](/guides/basic-features/routes/routes)。

## SSR mode 默认值变化

Modern.js 3.0 将 `server.ssr.mode` 的默认值从 `'string'` 改为 `'stream'`。这意味着当启用 SSR 时，默认使用流式渲染（streaming rendering）而不是传统的字符串渲染。

对于 React 18 及以上项目，把 `ssr.mode` 的值由 `'string'` 改为 `'string'`，不对 Data Loader 中的代码进行修改，并使用 Suspense 的话，从渲染结果上没有任何影响。如果你的项目依赖了 React17，请把 `ssr.mode` 的值手动设置为 `'string'`。


## 使用 React Router v7

Modern.js 3.0 默认使用 React Router v7 作为路由库。React Router v7 相比 v6 只有少量的 [不兼容变更](https://reactrouter.com/upgrading/v6)。

如果需要使用 React Router v5 或 React Router v6，需要使用**自控式路由**模式。自控式路由允许你完全控制路由配置，不受 Modern.js 约定式路由的限制。

## 使用 @modern-js/create 创建 Monorepo

Modern.js 之前提供的 Monorepo 方案是基于 [pnpm Workspace](https://pnpm.io/workspaces) 实现的，并未提供实质性的 Monorepo 管理能力。在 [v2.53.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.53.0) 版本中，移除了使用 `@modern-js/create` 创建 Monorepo 项目的功能。推荐直接使用社区提供的 Monorepo 方案。

## new 命令开启 test 能力

Modern.js 之前提供的测试能力是基于 Jest 的简单封装。该封装导致 Jest 配置不直观、用户配置更加复杂等问题。在 [v2.53.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.53.0) 版本中，移除了在应用项目和模块项目中开启 test 功能的选项。推荐直接使用社区提供的测试方案。

## Eslint 规则集

Modern.js 之前提供了 ESLint 的完整规则集，涵盖了 @modern-js（针对 Node.js 项目的 Lint 规则）和 @modern-js-app（针对前端项目的 Lint 规则）。在 [v2.60.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.60.0) 版本中，我们正式移除了这些规则集。我们鼓励开发者根据自身需求选择合适的代码规范工具，直接使用 ESLint 并结合社区推荐的规则，或使用 Biome 以提升代码格式化的性能。






