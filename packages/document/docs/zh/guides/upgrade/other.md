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

## useRuntimeContext 已废弃

Modern.js 3.0 中，`useRuntimeContext` Hook 已被废弃，推荐使用 `use(RuntimeContext)` 或 `useContext(RuntimeContext)` 替代。

**迁移示例**：

```tsx
// Modern.js 2.0
import { useRuntimeContext } from '@modern-js/runtime';

function App() {
  const { context } = useRuntimeContext();

  // isBrowser 在 context 内部
  if (context.isBrowser === true) {
    console.log('browser render');
  }
}
```

```tsx
// Modern.js 3.0
import { use } from 'react';
import { RuntimeContext } from '@modern-js/runtime';

function App() {
  const { context, isBrowser } = use(RuntimeContext);
  if (isBrowser === true) {
    console.log('browser render');
  }
}
```

**主要变化**：

- API 从 `useRuntimeContext()` 改为 `use(RuntimeContext)` 或 `useContext(RuntimeContext)`
- `isBrowser` 从 `context.isBrowser` 移到返回值顶层
- `context` 结构简化：只包含 `request` 和 `response`，不再包含 `logger`、`metrics` 等
- 返回值新增 `initialData`、`routes` 等属性

详细 API 文档请参考 [RuntimeContext 文档](/apis/app/runtime/core/runtime-context)。

## 不再支持 pages 目录的约定式路由

Modern.js 3.0 不再支持 Modern.js 1.0 版本引入的 `pages` 目录的约定式路由，统一使用 `routes` 目录的约定式路由。

如果你的项目使用了 `pages` 目录，需要将 `src/pages` 目录重命名为 `src/routes`，并更新项目中所有引用 `pages` 目录的导入路径。详细迁移步骤请参考 [约定式路由文档](/guides/basic-features/routes/routes)。

## SSR Mode 默认值变化

Modern.js 3.0 将 `server.ssr.mode` 的默认值从 `'string'` 改为 `'stream'`。这意味着当启用 SSR 时，默认使用流式渲染（streaming rendering）而不是传统的字符串渲染。

对于 React 18 及以上项目，把 `ssr.mode` 的值由 `'stream'` 改为 `'string'`，不对 Data Loader 中的代码进行修改或使用 Suspense 的话，从渲染结果上没有任何影响。如果你的项目依赖了 React17，请把 `ssr.mode` 的值手动设置为 `'string'`。


## 使用 React Router v7

Modern.js 3.0 默认使用 React Router v7 作为路由库。React Router v7 相比 v6 只有少量的 [不兼容变更](https://reactrouter.com/upgrading/v6)。

如果需要使用 React Router v5 或 React Router v6，需要使用**自控式路由**模式。自控式路由允许你完全控制路由配置，不受 Modern.js 约定式路由的限制。

## 使用 @modern-js/create 创建 Monorepo 和 Modern.js Module

Modern.js 3.0 不再支持通过 `@modern-js/create` 创建 Monorepo 项目和 Modern.js Module 项目。

**变更内容**：

- 在 [v2.53.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.53.0) 版本中，移除了使用 `@modern-js/create` 创建 Monorepo 项目的功能
- 在 [v2.61.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.61.0) 版本中，移除了使用 `@modern-js/create` 和 `modern new` 命令创建 Modern.js Module 项目的功能

**处理方式**：

- **Monorepo 项目**：Modern.js 之前提供的 Monorepo 方案是基于 [pnpm Workspace](https://pnpm.io/workspaces) 实现的，并未提供实质性的 Monorepo 管理能力。推荐直接使用社区提供的 Monorepo 方案，如 [Turborepo](https://turbo.build/)、[Nx](https://nx.dev/) 等。
- **Modern.js Module 项目**：推荐使用 [Rslib](https://rslib.rs/) 来创建和管理 JavaScript 库和 UI 组件项目。Rslib 是基于 Rsbuild 的库开发工具，提供了简单直观的方式来创建 JavaScript 库。详细使用方式请参考 [Rslib 官方文档](https://rslib.rs/)。

## new 命令和 upgrade 命令移除

Modern.js 3.0 移除了 `modern new` 和 `modern upgrade` 命令，需要按照文档手动操作。

**变更内容**：

- `modern new` 命令在 Modern.js 3.0 中不再支持，无法通过命令添加入口或启用功能
- `modern upgrade` 命令在 Modern.js 3.0 中不再支持，无法通过命令自动升级依赖

**处理方式**：

- **添加入口**：需要按照文档手动创建入口目录和文件。详细步骤请参考[页面入口文档](/guides/concept/entries)。
- **启用功能**：需要按照对应功能的文档手动安装依赖和配置。例如启用 BFF 功能，需要安装 `@modern-js/plugin-bff` 插件并在 `modern.config.ts` 中配置。
- **升级依赖**：需要手动更新 `package.json` 中所有 `@modern-js/**` 包的版本，然后重新安装依赖。详细步骤请参考[版本升级文档](/guides/get-started/upgrade)。

:::info 说明
移除这些命令的目的是让文档更贴合 AI Agent 的默认实现方式，不把操作做封装，使开发者能够更清晰地了解每个操作的具体步骤，也便于 AI Agent 根据文档直接执行相应的操作。
:::

## 不再内置 Arco/Antd 支持

Modern.js 2.0 内置了对 [Arco Design](https://arco.design/) 和 [Ant Design](https://ant.design/) 的按需引入支持，3.0 版本不再内置该能力，需要用户自行配置 `source.transformImport`。

如果项目中使用了 Arco Design 或 Ant Design，请手动添加对应的 `source.transformImport` 配置。

**Arco Design 迁移示例**：

```typescript
export default {
  source: {
    transformImport: [
      {
        libraryName: '@arco-design/web-react',
        libraryDirectory: 'es',
        camelToDashComponentName: false,
        style: 'css',
      },
      {
        libraryName: '@arco-design/web-react/icon',
        libraryDirectory: 'react-icon',
        camelToDashComponentName: false,
      },
    ],
  },
};
```

**Ant Design 迁移示例**（antd v4 及以下版本）：

```typescript
export default {
  source: {
    transformImport: [
      {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: 'css',
      },
    ],
  },
};
```

:::tip
antd v5 使用了 CSS-in-JS 方案，已原生支持按需加载，无需配置 `source.transformImport`。

更多用法请参考 [Rsbuild - source.transformImport](https://v2.rsbuild.rs/config/source/transform-import)。
:::

## Eslint 规则集

Modern.js 之前提供了 ESLint 的完整规则集，涵盖了 @modern-js（针对 Node.js 项目的 Lint 规则）和 @modern-js-app（针对前端项目的 Lint 规则）。在 [v2.60.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.60.0) 版本中，我们正式移除了这些规则集。我们鼓励开发者根据自身需求选择合适的代码规范工具，直接使用 ESLint 并结合社区推荐的规则，或使用 Biome 以提升代码格式化的性能。






