# 介绍

Modern.js Builder 是**一个面向现代 Web 开发场景的通用构建引擎**。

我们基于字节跳动数千个应用的实践经验，抽象出前端构建的最佳实践，提供 Web 开发所需的全方位能力。

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

## 下一步

你可能想要：

<NextSteps>
  <Step href="/guide/quick-start.html" title="快速上手" description="了解如何使用 Builder"/>
  <Step href="/guide/features.html" title="功能导航" description="了解 Builder 提供的所有功能"/>
  <Step href="/api" title="查阅 API" description="查看详细的 API 文档"/>
</NextSteps>
