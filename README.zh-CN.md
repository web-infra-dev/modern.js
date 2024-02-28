<p align="center">
  <a href="https://modernjs.dev" target="blank"><img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/ylaelkeh7nuhfnuhf/modernjs-cover.png" width="260" alt="Modern.js Logo" /></a>
</p>

<h1 align="center">Modern.js</h1>

<p align="center">
  Inspire creativity in modern web development.
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/@modern-js/core?style=flat-square&color=00a8f0" alt="npm version" />
  <img src="https://img.shields.io/npm/dm/@modern-js/core.svg?style=flat-square&color=00a8f0" alt="downloads" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&color=00a8f0" alt="License" />
</p>

[English](./README.md) | 简体中文

## 介绍

Modern.js 是字节跳动 Web 工程体系的开源版本，包含：

- 🦄 [Modern.js Framework](https://modernjs.dev/)：基于 React 的渐进式 Web 开发框架。
- 🐧 [Modern.js Module](https://modernjs.dev/module-tools)：简单、高性能的 npm 包开发方案。

## 快速上手

- 使用 [Modern.js Framework](https://modernjs.dev/guides/get-started/quick-start) 来开发一个 Web 应用。
- 使用 [Modern.js Module](https://modernjs.dev/module-tools/guide/intro/getting-started.html) 来开发一个 npm 包。

## 生态

Modern.js 生态提供了以下解决方案和底层库：

- 🦀 [Rspack](https://github.com/web-infra-dev/rspack)：基于 Rust 的高性能模块打包工具。
- 🐬 [Rsbuild](https://github.com/web-infra-dev/rsbuild)：基于 Rspack 的 Web 构建工具，由 Modern.js Builder 演变而来。
- 🐹 [Rspress](https://github.com/web-infra-dev/rspress)：基于 Rspack 的静态站点生成器。
- 🐟 [Garfish](https://github.com/web-infra-dev/garfish)：一站式微前端解决方案。
- 🦆 [Reduck](https://github.com/web-infra-dev/reduck)：基于 Redux 的状态管理库。
- 🐴 [SWC Plugins](https://github.com/web-infra-dev/swc-plugins)：Modern.js 的 SWC 插件。

## Benchmark

我们通过 [Modern.js Benchmark](https://web-infra-qos.netlify.app/) 来观测核心指标的变化情况，比如 bundle size、compile speed 和 install size。

## Roadmap

请参阅 [Modern.js Roadmap](https://github.com/web-infra-dev/modern.js/issues/4741)。我们将在每个季度更新 Roadmap 的内容。

## 示例

Modern.js 提供了一系列开箱即用的示例项目，你可以在 [modern-js-examples](https://github.com/web-infra-dev/modern-js-examples) 仓库中找到并使用它们。

## 参与贡献

> 欢迎参与 Modern.js 贡献！

请阅读 [贡献指南](https://github.com/web-infra-dev/modern.js/blob/main/CONTRIBUTING.md) 来共同参与 Modern.js 的建设。

### 行为准则

本仓库采纳了字节跳动的开源项目行为准则。请点击 [行为准则](./CODE_OF_CONDUCT.md) 查看更多的信息。

### 贡献者们

感谢以下伙伴们为 Modern.js 做出的贡献：

<a href="https://github.com/web-infra-dev/modern.js/graphs/contributors">
  <img src="https://opencollective.com/modernjs/contributors.svg?width=890&button=false" alt="contributors">
</a>

## Credits

Modern.js 中的部分代码是参考社区中的其他项目实现的，比如 [create-react-app](https://github.com/facebook/create-react-app)，[remix](https://github.com/vuejs/remix)，[jest](https://github.com/facebook/jest) 和 [bundle-require](https://github.com/egoist/bundle-require) 等，感谢这些项目：

- `@modern-js/bundle-require`：修改自 [bundle-require](https://github.com/egoist/bundle-require)。
- `@modern-js/plugin`：hook API 的实现参考了 [farrow-pipeline](https://github.com/farrow-js/farrow/tree/master/packages/farrow-pipeline)。
- `@modern-js/plugin-testing`：jest runner 参考了 [jest-cli](https://github.com/facebook/jest/blob/fdc74af37235354e077edeeee8aa2d1a4a863032/packages/jest-cli/src/cli/index.ts#L21)。
- `@modern-js/plugin-data-loader`：部分实现参考了 [remix](https://github.com/remix-run/remix)。
- `@modern-js/babel-plugin-module-resolver`: 修改自 [babel-plugin-module-resolver](https://github.com/tleunen/babel-plugin-module-resolver)。

## License

Modern.js 项目基于 [MIT 协议](https://github.com/web-infra-dev/modern.js/blob/main/LICENSE)，请自由地享受和参与开源。

第三方 licenses 列举于 [THIRD-PARTY-LICENSE](./THIRD-PARTY-LICENSE) 中。
