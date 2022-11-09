# 通用类问题

## Modern.js Builder 和 Modern.js 的关系？

Modern.js 2.0 的构建能力是基于 Modern.js Builder 实现的。

在开发 Modern.js 2.0 的过程中，我们把 Builder 作为独立的模块进行设计，并明确划分 Builder 与 Modern.js 的职责界限。
因此，Builder 可以脱离 Modern.js 框架使用，被单独应用于其他框架或场景。

## Builder 能否用于构建工具库或组件库？

Builder 专注于解决 Web 应用构建场景，我们不推荐你使用 Builder 来构建工具库或组件库。

如果需要构建工具库或组件库，推荐使用 [Modern.js 模块工程方案](https://modernjs.dev/docs/start/library)。

## Builder 是否会支持 turbopack？

对于 webpack 的继任者 —— [turbopack](https://turbo.build/pack)，我们会持续关注它后续的发展情况。

目前 turbopack 仅支持在 next.js 中使用，当 turbopack 支持独立使用，并且完成度和社区生态达到一定水平时，我们也会考虑进行接入。
