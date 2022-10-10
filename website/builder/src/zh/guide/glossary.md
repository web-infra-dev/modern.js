# 名词解释

## Bundler

指 `webpack` 和 `rspack` 等模块打包工具。

当 Bundler 处理 JavaScript 应用时，它会构建一个依赖关系图，其中包含应用需要的各个模块，然后将所有模块打包成一个或多个 bundle。

## Rspack

字节跳动 Web Infra 团队自研的 Rust Bundler，目前仍在研发过程中，尚未开源。

## Builder

Builder 可以翻译为「构建引擎」，Builder 的目标是「复用构建工具的最佳实践」。

因为 webpack 等 Bundler 是比较底层的，如果我们基于 webpack 来构建一个项目，需要充分理解 webpack 的各个配置项和三方插件，并进行大量的配置组装和性能调优等工作。

Builder 比 Bundler 的封装程度更高，默认集成代码转换、代码压缩等能力。通过接入 Builder，可以快速获得构建现代 Web 应用的能力。

Builder 内部的分层如下：

<img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/builder-struct-10092.png" />

## Builder Provider

Builder Provider 是 Builder 的组成部分之一，Provider 基于特定 bundler 实现了对应的构建能力。

目前 Builder 提供了两个 Provider：

- `@modern-js/builder-webpack-provider`：底层基于 webpack 来实现。
- `@modern-js/builder-rspack-provider`：底层基于 rspack 来实现。

## Modern.js

一套现代 Web 工程方案。

Modern.js 由字节跳动 Web Infra 团队开源，提供了一系列现代 Web 开发的最佳工程实践，如前后端一体化、约定式路由、构建方案、样式方案等。

[Modern.js 官网地址](https://modernjs.dev/)。
