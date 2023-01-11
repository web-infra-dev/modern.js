---
sidebar_position: 4
---

# 使用微生成器

模块工程解决方案提供了微生成器工具，它可以为当前项目：

- 新增目录和文件
- 修改 `package.json` 文件内容
- 执行命令

因此通过这些能力，**微生成器可以为项目开启额外的特性功能**。

可以通过 [`modern new`](/guide/basic/command-preview) 启动微生成器。目前模块工程方案支持的微生成器功能有：

## Storybook 调试

当我们想要对组件或者普通模块进行调试的时候，可以启用 **Storybook 调试功能**。启动该功能后，**会在项目目录下创建 `stories` 目录以及相关文件，在 package.json 中新增 `"@modern-js/plugin-storybook"` 依赖**。

关于如何启动 Storybook 以及如何使用 Storybook，可以查看下面的链接：

- [`modern dev`](/guide/basic/command-preview#modern-dev)
- [使用 Storybook](/guide/basic/using-storybook)

## Tailwind CSS 支持

当我们想要为项目增加 [Tailwind CSS](https://v2.tailwindcss.com/) 支持的时候，可以启动这个功能。Tailwind CSS 是一个 CSS 库，提供开箱即用的样式。

关于如何在模块工程里使用 Tailwind CSS，可以查看：

- [使用 Tailwind CSS](https://modernjs.dev/docs/apis/module/config/tools/tailwindcss)

## 启动 Modern.js Runtime API

**Modern.js 提供了 [Runtime API](https://modernjs.dev/docs/apis/module/runtime/) 能力，这些 API 只能在 Modern.js 的应用项目环境中使用**。如果你需要开发一个 Modern.js 应用环境中使用的组件，那么你可以开启该特性，微生成器会增加 `"@modern-js/runtime"`依赖。

另外，Storybook 调试工具也会通过检测项目的依赖确定项目是否需要使用 Runtime API，并且提供与 Modern.js 应用项目一样的 Runtime API 运行环境。
