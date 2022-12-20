---
title: 入口
sidebar_position: 2
---

入口是 Modern.js 默认的文件约定，项目的每一个入口是一张独立的页面，对应一条**服务端路由**。

很多配置，如 HTML 模板、Meta 信息、是否开启 SSR、SSG、服务端路由规则都是以入口为维度划分的。

## 单入口与多入口

Modern.js 初始化的项目是单入口的，项目结构如下：

```
.
├── src
│   ├── modern-app-env.d.ts
│   └── routes
│       ├── index.css
│       ├── layout.tsx
│       └── page.tsx
├── package.json
├── modern.config.ts
├── pnpm-lock.yaml
├── README.md
└── tsconfig.json
```

Modern.js 可以很方便的将单入口切换成多入口。可以在项目下执行 `pnpm run new`，通过生成器创建入口：

```bash
? 请选择你想要的操作 创建工程元素
? 创建工程元素 新建「应用入口」
? 请填写入口名称 new-entry
```

执行后，`src/` 目录将会变成如下结构：

```
.
├── modern-app-env.d.ts
├── myapp
│   └── routes
│       ├── index.css
│       ├── layout.tsx
│       └── page.tsx
└── new-entry
    └── routes
        ├── index.css
        ├── layout.tsx
        └── page.tsx
```

原本的代码被移动到了和 `package.json` 中 `name` 同名的目录下，并创建了新的目录。

执行 `pnpm run dev` 后，可以看到新增一条 `/new-entry` 的路由，并且被迁移的代码路由并未发生变化。

:::note
Modern.js 会将和 `package.json` 中 `name` 字段同名的入口作为主入口，默认路由为 `/`，其他入口默认路由为 `/{entryName}`。
:::


## 入口类型

不同的入口类型具有不同的编译和运行时行为。在 Modern.js 创建项目时，开发者可以手动选择创建**框架模式**或是**构建模式**的项目。完成创建后，可以看到不同模式的项目样板文件是不同的。

默认情况下，Modern.js 启动项目前会对 `src/` 下的文件进行扫描，识别入口，并生成对应的服务端路由。

:::tip
可以通过 [source.entriesDir](/docs/configure/app/source/entries-dir) 更改入口目录为其他目录。
:::

并非 `src/` 下所有的一级目录都会成为项目入口, 入口所在目录必须满足以下四个条件之一：

1. 具有 `routes/` 目录
2. 具有 `App.[jt]sx?` 文件
3. 具有 `index.[jt]sx?` 文件
2. 具有 `pages/` 目录（兼容 Modern.js 1.0）

当 `src/` 目录满足入口特征时，Modern.js 会认为当前项目为单入口应用。

:::tip
单入口默认的入口名为 `main`。
:::

当项目不是单入口应用时，Modern.js 会进一步查看 `src/` 下的一级目录。

### 框架模式入口

框架模式指需要使用 Modern.js 框架能力，例如 Router、SSR、一体化调用等。这类入口约定下，开发者定义的入口并不是真正的 Webpack 编译入口。Modern.js 在启动时会生成一个封装过的入口，可以在 `node_modules/.modern/{entryName}/index.js` 找到真正的入口。

#### 约定式路由

如果入口中存在 `routes/` 目录，Modern.js 会在启动时扫描 `routes/` 下的文件，基于文件约定，自动生成客户端路由（react-router）。

详细内容可以参考[路由](/docs/guides/basic-features/routes)。

#### 自定义路由

如果入口中存在 `App.[jt]sx?` 文件，开发者可以在这个文件中自由的设置客户端路由，或者不设置客户端路由。

详细内容可以参考[路由](/docs/guides/basic-features/routes)。

#### 自定义 App

如果入口中存在 `index.[jt]sx` 文件，并且当文件默认导出函数时，Modern.js 还是会根据 runtime 的设置情况生成 createApp 包裹后的代码。在渲染过程中，将 createApp 包裹后的组件作为参数传递给 index 文件导出的函数，这样开发者可以自定义将组件挂载到 DOM 节点上，或在挂载前添加自定义行为。例如：

```tsx
import ReactDOM from 'react-dom/client'
import { bootstrap } from '@modern-js/runtime';


export default (App: React.ComponentType) => {
  // do something before bootstrap...
  bootstrap(App, 'root', undefined, ReactDOM);
};
```

:::warning
由于 bootstrap 函数需要兼容 React17 和 React18 的用法，调用 bootstrap 函数时需要手动传入 ReactDOM 参数。
:::

Modern.js 生成的文件内容如下：

```js
import React from 'react';
import ReactDOM from 'react-dom/client';
import customBootstrap from '@_edenx_src/index.tsx';
import App from '@_edenx_src/App';
import { router, state } from '@edenx/runtime/plugins';

const IS_BROWSER = typeof window !== 'undefined' && window.name !== 'nodejs';
const MOUNT_ID = 'root';

let AppWrapper = null;

function render() {
  AppWrapper = createApp({
    // runtime 的插件参数...
  })(App)
  if (IS_BROWSER) {
    customBootstrap(AppWrapper);
  }
  return AppWrapper
}

AppWrapper = render();

export default AppWrapper;;
```

### 构建模式入口

构建模式是指不使用任何 Modern.js 运行时的能力，完全由开发者自己定义项目 Webpack 的入口。

如果入口中存在 `index.[jt]sx` ，并且没有默认导出函数时，这时候该文件就是真正的 Webpack 入口文件。这里和 [Create React App](https://github.com/facebook/create-react-app) 类似，需要自己将组件挂载到 DOM 节点、添加热更新代码等。例如:

```js title=src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
```

Modern.js **不推荐**使用这种方式，这种方式丧失了框架的一些能力，如 **`modern.config.js` 文件中的 `runtime` 配置将不会再生效**。但是在项目从其他框架迁移到 Modern.js，例如 CRA，或是自己手动搭建的 webpack 时，这种方式会非常有用。

## 使用配置文件定义入口

有些时候，已有的项目并不是按照 Modern.js 的目录结构来搭建的。如果强行要按照这种结构来工作，会有比较大的迁移成本。

在 Modern.js 中，除了使用文件约定生成入口外，还可以在 `modern.config.[jt]s` 中手动配置入口。

```ts
export default defineConfig({
  source: {
    entries: {
      // 指定一个名称为 entry_customize 的新入口
      entry_customize: './src/home/test/index.js',
    },
  },
});
```

:::tip
详情可以查看 [source.entries](/docs/configure/app/source/entries)。
:::

## 禁用默认入口扫描

另外，项目的部分结构可能恰巧命中了 Modern.js 的约定，但实际上这部分并不是真实的入口。

Modern.js 提供了配置，来禁用默认的入口扫描。与配置的入口结合使用，大部分项目可以在不修改目录结构的情况下，快速的进行迁移。

```ts
export default defineConfig({
  source: {
    disableDefaultEntries: true,
  },
});
```

:::tip
详情可以查看 [source.disableDefaultEntries](/docs/configure/app/source/disable-default-entries)。
:::
