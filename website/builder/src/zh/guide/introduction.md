# 介绍

Modern.js Builder 是**一个面向现代 Web 开发场景的构建引擎**。

随着前端生态的发展，社区中出现了多样化的编译工具和插件。对于大部分开发者来说，构建一个 Web 应用所需的配置和依赖已变得十分复杂。在追求最佳实践的过程中，开发者需要付出的成本也在不断上升。

为了减少构建的复杂性，降低上手门槛，我们基于 Modern.js 在 Web 应用构建方面的实践经验，抽象其中的构建能力，打造出 Modern.js Builder 这个开源工具。

## Rust 化

近年来，前端工具链的发展趋势是使用 Rust 等编程语言重新实现 —— 以获得更好的性能表现。社区中出现 [SWC](https://swc.rs/)、[esbuild](https://github.com/evanw/esbuild)、[Turbopack](https://turbo.build/pack) 等高性能工具，并且应用领域在逐步扩宽。但这些 Rust 工具与 JavaScript 工具之间存在较多差异，包括功能不完整、配置不一致等，导致使用者需要承担一定的迁移成本。

<img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/rust-tools-11175.png" />

前端工具链 Rust 化的进程还会持续较长一段时间，**Modern.js Builder 期望能帮助开发者更好地过渡到 Rust 工具**。不管是 JavaScript 工具，还是 Rust 工具，甚至是 webpack 等底层 bundler，在 Modern.js Builder 中都是可替换的零部件。你可以通过开启配置或启用插件的方式，对这些零部件进行渐进式替换，Modern.js Builder 会抹平其中的主要差异，帮助使用者进行低成本迁移。

## 定位

Modern.js Builder (简称 Builder) 的定位是**服务于上层框架的构建引擎**，它专注于解决 Web 应用构建面临的各类问题，期望能为前端框架提供开箱即用的构建能力。

<img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/builder-layers-1117.png" style="max-width: 80%; margin-left: 10%" />

如果你正在开发一个前端框架，或是开发一个前端应用的脚手架，那么 Builder 可以为你完成前端框架中大部分与构建有关的逻辑，让你能够聚焦于实现框架的其他功能。

如果你是一名业务开发者，大部分情况下，你不需要在业务项目中手动接入 Builder，我们推荐你直接使用一些基于 Builder 的上层框架。

目前已经接入 Builder 的前端框架有：

- 开源的 [Modern.js 2.0](https://github.com/modern-js-dev/modern.js) 框架。
- 字节跳动内部的 EdenX、PIA 等框架。

## 特性

### 支持多种打包工具

在架构上，**Builder 支持多种打包工具**，使用者可以根据自身需求来使用不同的打包工具。

默认情况下，Builder 使用 webpack 5 作为打包工具，尽管 webpack 的编译速度不是很理想，但它依然是社区中功能最完整、生态最丰富的打包工具。Builder 在 webpack 的基础上，集成了 [babel](https://github.com/babel/babel)、[postcss](https://github.com/postcss/postcss)、[terser](https://github.com/terser/terser) 等工具进行代码转义和压缩。Builder 也支持替换部分编译能力为原生工具来提升编译速度，比如将 babel/terser 替换为 [swc](https://github.com/swc-project/swc) 或 [esbuild](https://github.com/evanw/esbuild)。

除了 webpack 打包，Builder 也正在对接**字节跳动 Web Infra 团队自研的 Rust Bundler —— rspack**，以提供更快的编译速度。

目前，Builder 基于 webpack 的构建已经成熟可用，基于 rspack 的构建仍在开发过程中，敬请期待。

:::tip 关于 Turbopack
尽管 Builder 已经在对接 rspack，对于 webpack 的继任者 —— [Turbopack](https://turbo.build/pack)，我们也会持续关注它后续的发展情况。

目前 Turbopack 仅支持在 Next.js 中使用，当 Turbopack 支持独立使用，并且完成度和社区生态达到一定水平时，我们会考虑进行接入。
:::

### 深度优化构建产物

Builder **充分利用 webpack 生态内的各种优化手段**，保证生产环境的产物性能得到深度优化，并在稳定性上提供保障。

以拆包场景为例，webpack 原生的 splitChunks 配置较为复杂，Builder 将其封装为开箱即用的 [performance.chunkSplit](/zh/api/config-performance.html#performance-chunksplit) 配置项，默认将常见的三方库拆分为体积适中的 chunk，使页面加载速度达到最优状态。

### 易于扩展的插件系统

Builder 提供丰富的配置项和可插拔的插件系统，支持对各项能力进行扩展和定制。

对于 Builder 来说，所有的构建能力都是通过插件来实现的：

- 大部分插件较为轻量，被内置在 Builder 内部，开发者可以通过配置项来控制启用。
- 少部分插件较为复杂，被外置为独立 npm 包，开发者可以按需进行安装和使用。

Builder 也支持自定义插件，因此框架开发者可以开发自定义的插件，实现定制化的构建需求。

## npm 包

Builder 已发布的 npm 包有：

| 包名                                                                                                               | 版本                                                                                              | 描述                   |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------- |
| [@modern-js/builder](https://www.npmjs.com/package/@modern-js/builder)                                             | ![](https://img.shields.io/npm/v/@modern-js/builder?style=flat-square)                       | Builder 核心包         |
| [@modern-js/builder-webpack-provider](https://www.npmjs.com/package/@modern-js/builder-webpack-provider)           | ![](https://img.shields.io/npm/v/@modern-js/builder-webpack-provider?style=flat-square)      | 提供 webpack 构建能力  |
| [@modern-js/builder-rspack-provider](https://www.npmjs.com/package/@modern-js/builder-rspack-provider)             | ![](https://img.shields.io/npm/v/@modern-js/builder-rspack-provider?style=flat-square)       | 提供 rspack 构建能力   |
| [@modern-js/builder-plugin-swc](https://www.npmjs.com/package/@modern-js/builder-plugin-swc)                       | ![](https://img.shields.io/npm/v/@modern-js/builder-plugin-swc?style=flat-square)            | SWC 插件               |
| [@modern-js/builder-plugin-stylus](https://www.npmjs.com/package/@modern-js/builder-plugin-stylus)                       | ![](https://img.shields.io/npm/v/@modern-js/builder-plugin-stylus?style=flat-square)            | Stylus 插件               |
| [@modern-js/builder-plugin-esbuild](https://www.npmjs.com/package/@modern-js/builder-plugin-esbuild)               | ![](https://img.shields.io/npm/v/@modern-js/builder-plugin-esbuild?style=flat-square)        | Esbuild 插件           |
| [@modern-js/builder-plugin-node-polyfill](https://www.npmjs.com/package/@modern-js/builder-plugin-node-polyfill)   | ![](https://img.shields.io/npm/v/@modern-js/builder-plugin-node-polyfill?style=flat-square)  | Node Polyfill 插件     |
| [@modern-js/builder-plugin-image-compress](https://www.npmjs.com/package/@modern-js/builder-plugin-image-compress) | ![](https://img.shields.io/npm/v/@modern-js/builder-plugin-image-compress?style=flat-square) | Image Compress 插件           |
| [@modern-js/builder-shared](https://www.npmjs.com/package/@modern-js/builder-shared)                               | ![](https://img.shields.io/npm/v/@modern-js/builder-shared?style=flat-square)                | Builder 内部的公共模块 |
| [@modern-js/builder-doc](https://www.npmjs.com/package/@modern-js/builder-doc)                                     | ![](https://img.shields.io/npm/v/@modern-js/builder-doc?style=flat-square)                   | 提供可复用的文档片段   |

你可以在 modern.js 仓库的 [packages/builder](https://github.com/modern-js-dev/modern.js/tree/main/packages/builder/) 目录下查看这些包的源代码。

## 下一步

你可能想要：

<NextSteps>
  <Step href="/guide/quick-start.html" title="快速上手" description="了解如何使用 Builder"/>
  <Step href="/guide/features.html" title="功能导航" description="了解 Builder 提供的所有功能"/>
  <Step href="/api" title="查阅 API" description="查看详细的 API 文档"/>
</NextSteps>
