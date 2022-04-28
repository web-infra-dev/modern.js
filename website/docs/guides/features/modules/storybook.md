---
sidebar_position: 4
---

# 使用 Storybook 调试

Modern.js 针对可复用模块提供了 Storybook 功能进行代码调试。本章将要介绍如何在可复用模块项目中使用它。

## 开启 Storybook 功能

默认情况下，可复用模块项目没有提供 Storybook 功能，需要通过微生成器来开启。可以在项目根目录下执行如下命令运行微生成器：

```
pnpm run new
```

我们按照如下进行选择：

```
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用 「Storybook」
```

然后就可以等待依赖安装成功以及初始化目录生成。当成功开启后，我们会看到如下变化：

**package.json**
``` json
{
  "devDependencies": {
++  "@modern-js/plugin-storybook": "^1"
  },
}
```

新增 `./stories` 目录以及默认的 `./stories/index.stories.tsx` 文件：

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/guides/storybook-add-dir.png)

## 使用 Storybook 功能

上面我们已经成功的开启 Storybook 功能。接下来就可以使用它来调试代码。运行 Storybook 只需要在项目根目录执行以下命令：

```
pnpm run dev
```

或者

```
pnpm run dev story
```

:::info 补充信息
Modern.js 后续会新增更加丰富的调试功能。当开启多个调试功能的时候，则执行 `pnpm run dev` 会出现可以执行的调试功能菜单列表。当只存在一个调试功能的情况下，执行 `pnpm run dev` 会默认执行它。
:::

当成功运行后，我们会看到如下 log 信息：

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/guides/storybook-log.png)


访问其中的 URL 地址，可以看到：

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/guides/storybook-iframe.png)


想了解关于 Storybook 的更多内容，可以在 [Introduction to Storybook for React](https://storybook.js.org/docs/react/get-started/introduction) 这里查看。

关于如何开发 Storybook，可以参考 [How to write stories](https://storybook.js.org/docs/react/writing-stories/introduction)。

## 对 Storybook 进行配置

Storybook 官方使用了项目目录下名字为 `.storybook` 的目录作为配置目录，其中包含多种配置文件。关于配置文件的使用，可以阅读 [Configure Storybook
](https://storybook.js.org/docs/react/configure/overview)。

在 Modern.js 中，默认提供了 `config/storybook` 目录替代 `.storybook` 目录，你可以在 `config/storybook` 目录下创建 `main.js` 等配置文件。

不过在 Modern.js 中使用 Storybook 会有些限制：

* **对于配置文件 `main.js`，不可以在其中对 `stories`、`webpackFinal`、`babel`（以及与 webpack 和 babel 有关的配置）这些进行配置**。

## 对于 Modern.js 运行时 API 的使用和支持

Modern.js 提供了丰富的运行时 API（后面简称 Runtime API），所有的 Runtime API 可以在 Modern.js 的应用项目中直接使用。

为使用 Runtime API 的可复用模块代码，也可以在 Storybook 中正常调试。可复用模块项目提供的 Storybook 也对 Runtime API 进行了支持。不过在使用过程中有以下需要注意的事情：

目前对 Runtime API 还不完全支持，因此在使用的时候要注意以下**暂不支持的 API**：

- App API:
  - [`useModuleApp`](/docs/apis/runtime/app/use-module-app)
  - [`useModuleApps`](/docs/apis/runtime/app/use-module-apps)
- BFF 相关功能目前还不支持：
  - [`useContext`](/docs/apis/runtime/bff-server/use-context)
  - [`hook`](/docs/apis/runtime/bff-server/hook)
- Testing API
  - [`render`](/docs/apis/runtime/testing/render)
  - [`renderApp`](/docs/apis/runtime/testing/renderApp)
  - [`cleanup`](/docs/apis/runtime/testing/cleanup)
  - [`act`](/docs/apis/runtime/testing/act)
- Web Server API
  - [`hook`](/docs/apis/runtime/web-server/hook)
- [Electron API](/docs/apis/runtime/electron/overview)
- [插件 API](/docs/apis/runtime/plugin/abstract)
