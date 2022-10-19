# 介绍

Modern.js Builder 是**一个面向现代 Web 开发场景的通用构建引擎**。

我们基于字节跳动数千个应用的实践经验，抽象出前端构建的最佳实践，提供 Web 开发所需的全方位能力。

## 定位

Modern.js Builder 的定位是**服务于上层前端框架的构建引擎**，Builder 专注于前端构建领域，目标是为前端框架提供开箱即用的构建能力。

如果你正在开发一个前端框架，或是一个前端应用的脚手架，那么 Builder 可以为你完成前端框架中绝大部分与构建有关的逻辑，让你能够聚焦于实现框架的其他功能。

如果你是一名业务开发者，大部分情况下，你不需要在业务项目中手动接入 Builder，我们推荐直接使用一些基于 Builder 的上层框架。

目前已经接入 Builder 的前端框架有：

- 开源的 [Modern.js 2.0](https://github.com/modern-js-dev/modern.js) 框架。
- 字节跳动内部的 EdenX、PIA 等框架。

## 特性

### 开箱即用的双构建引擎

在设计上，**Builder 支持双构建引擎：webpack & rspack**。

默认情况下，Builder 使用 webpack 作为打包工具，集成了社区中成熟的 [babel](https://github.com/babel/babel)、[postcss](https://github.com/postcss/postcss)、[terser](https://github.com/terser/terser) 等工具进行代码转义和压缩，也支持通过新兴的 [swc](https://github.com/swc-project/swc)、[esbuild](https://github.com/evanw/esbuild) 等工具来提升编译效率。

同时，Builder 也正在对接**字节跳动自研的 Rust Bundler —— rspack**，以提供更极致的编译速度。

目前 webpack 构建引擎已经成熟可用，rspack 构建引擎仍在开发过程中，敬请期待。

### 深度优化构建产物

现阶段，webpack 仍然是产物优化最全面的打包工具。

Builder **充分利用 webpack 生态内的各种优化手段**，保证生产环境的产物性能最优，并在稳定性上有充分的保障。

以拆包场景为例，webpack 原生的 splitChunks 配置较为复杂，Builder 将其封装为开箱即用的 [performance.chunkSplit](/zh/api/config-performance.html#performance-chunksplit) 配置项，默认将常见的三方库拆分为体积适中的 chunk，使页面加载速度达到最优状态。

### 易于扩展的插件系统

Builder 提供丰富的配置项和灵活的插件系统，支持对各项能力进行深度定制。

Builder 所有的构建能力都通过插件来实现：

- 大部分插件较为轻量，被内置在 Builder 内部，通过配置项来控制启用。
- 少部分插件较为复杂，被外置为独立 npm 包，可以按需进行安装和注册。

Builder 支持自定义插件，使框架开发者可以实现定制化的构建需求。

## npm 包

Builder 已发布的 npm 包有：

| 包名                                                                                                             | 版本                                                                                        | 描述                   |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------- |
| [@modern-js/builder](https://www.npmjs.com/package/@modern-js/builder)                                           | ![](https://img.shields.io/npm/v/@modern-js/builder?style=flat-square)                      | Builder 核心包         |
| [@modern-js/builder-webpack-provider](https://www.npmjs.com/package/@modern-js/builder-webpack-provider)         | ![](https://img.shields.io/npm/v/@modern-js/builder-webpack-provider?style=flat-square)     | 提供 Webpack 构建能力  |
| [@modern-js/builder-plugin-esbuild](https://www.npmjs.com/package/@modern-js/builder-plugin-esbuild)             | ![](https://img.shields.io/npm/v/@modern-js/builder-plugin-esbuild?style=flat-square)       | ESBuild 插件           |
| [@modern-js/builder-plugin-node-polyfill](https://www.npmjs.com/package/@modern-js/builder-plugin-node-polyfill) | ![](https://img.shields.io/npm/v/@modern-js/builder-plugin-node-polyfill?style=flat-square) | Node Polyfill 插件     |
| [@modern-js/builder-shared](https://www.npmjs.com/package/@modern-js/builder-shared)                             | ![](https://img.shields.io/npm/v/@modern-js/builder-shared?style=flat-square)               | Builder 内部的公共模块 |
| [@modern-js/builder-doc](https://www.npmjs.com/package/@modern-js/builder-doc)                                   | ![](https://img.shields.io/npm/v/@modern-js/builder-doc?style=flat-square)                  | 提供可复用的文档片段   |

你可以在 modern.js 仓库的 [packages/builder](https://github.com/modern-js-dev/modern.js/tree/main/packages/builder/) 目录下查看这些包的源代码。

## 下一步

你可能想要：

<NextSteps>
  <Step href="/guide/quick-start.html" title="快速上手" description="了解如何使用 Builder"/>
  <Step href="/guide/features.html" title="功能导航" description="了解 Builder 提供的所有功能"/>
  <Step href="/api" title="查阅 API" description="查看详细的 API 文档"/>
</NextSteps>
