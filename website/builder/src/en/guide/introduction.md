# Introduction

Modern.js Builder is **a Build Engine for Modern Web Development**.

With the growing of the front-end ecosystem, more and more build tools and plugins are created. For most developers, the configuration and dependencies required to build a web application have become complex; the cost of finding best practices for developers has also risen.

In order to reduce the complexity and make it easier to build a project, we abstracted the reusable build abilities based on the practical experience of ByteDance, and created the open source tool Modern.js Builder.

## Motivation

Modern.js Builder is a build engine serving the upper-level front-end frameworks. It focuses on solving problems in web application building, and expects to provide out-of-box building abilities for front-end frameworks.

If you are developing a front-end framework, or developing a scaffolding for a front-end application, Builder can provide most of the build logics for you, which allowing you to focus on implementing other features of the framework.

If you are a business developer, in most cases, you do not need to manually install Builder in your projects. We recommend that you use the upper-level frameworks based on Builder.

Currently, the following front-end frameworks are already using Builder:

- [Modern.js 2.0](https://github.com/modern-js-dev/modern.js) Framework (Open source).
- EdenX Framework and PIA Framework inside ByteDance.

## Features

### Support Multiple Bundlers

**Builder supports using multiple bundlers**, users can use different bundlers according the your needs.

By default, Builder uses webpack 5 as the bundler. Although the compilation speed of webpack is not ideal, it is still the most mature and ecological bundler in the community. Based on webpack, Builder integrates [babel](https://github.com/babel/babel), [postcss](https://github.com/postcss/postcss), [terser](https://github.com/terser/terser) and other tools to transform or minify codes. Builder also supports replacing some compile tools with native tools to improve compilation speed, such as replacing babel/terser with [swc](https://github.com/swc-project/swc) or [esbuild](https://github.com/evanw/esbuild).

At the same time, We are integrating rspack to improve compilation speed, rspack is a Rust Bundler developed by ByteDance.

At present, the webpack provider is stable for production, and the rspack provider is still under development.

:::tip About turbopack
[turbopack](https://turbo.build/pack) is the rust-powered successor to webpack, we will continue to pay attention to it. At present, turbopack only supports use in next.js. When turbopack can be used independently, and the completion and community ecology reach a certain level, we will also consider to support it.
:::

### Deep optimization

Builder **makes full use of various optimization strategies** in the webpack ecosystem to ensure the product performance in the production environment.

Taking the chunk splitting scenario as an example, the webpack's splitChunks config is complex, and Builder makes it as an out-of-the-box [performance.chunkSplit](/en/api/config-performance.html#performance-chunksplit) config, it will split common third-party libraries into chunks to make page loading faster.

### Extensible Plugin System

Provides rich configuration items and a flexible plugin system to support in-depth customization of all features.

For Builder, all building abilities are achieved through plugins:

- Most of the plugins are lightweight, built in Builder, and developers can enable or disable them through configs.
- Some plugins are more complex and developed as independent npm packages, developers can install and use them as needed.

Builder also supports custom plugins, so framework developers can develop custom plugins to meet customized requirements.

## npm packages

Below is the npm package published by Builder.

| Package                                                                                                          | Version                                                                                     | Description                       |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------- |
| [@modern-js/builder](https://www.npmjs.com/package/@modern-js/builder)                                           | ![](https://img.shields.io/npm/v/@modern-js/builder?style=flat-square)                      | Core package of Builder           |
| [@modern-js/builder-webpack-provider](https://www.npmjs.com/package/@modern-js/builder-webpack-provider)         | ![](https://img.shields.io/npm/v/@modern-js/builder-webpack-provider?style=flat-square)     | Provides webpack build ability    |
| [@modern-js/builder-rspack-provider](https://www.npmjs.com/package/@modern-js/builder-rspack-provider)           | ![](https://img.shields.io/npm/v/@modern-js/builder-rspack-provider?style=flat-square)      | Provides rspack build ability     |
| [@modern-js/builder-plugin-swc](https://www.npmjs.com/package/@modern-js/builder-plugin-swc)                     | ![](https://img.shields.io/npm/v/@modern-js/builder-plugin-swc?style=flat-square)           | SWC Plugin                        |
| [@modern-js/builder-plugin-esbuild](https://www.npmjs.com/package/@modern-js/builder-plugin-esbuild)             | ![](https://img.shields.io/npm/v/@modern-js/builder-plugin-esbuild?style=flat-square)       | ESBuild Plugin                    |
| [@modern-js/builder-plugin-node-polyfill](https://www.npmjs.com/package/@modern-js/builder-plugin-node-polyfill) | ![](https://img.shields.io/npm/v/@modern-js/builder-plugin-node-polyfill?style=flat-square) | Node Polyfill Plugin              |
| [@modern-js/builder-shared](https://www.npmjs.com/package/@modern-js/builder-shared)                             | ![](https://img.shields.io/npm/v/@modern-js/builder-shared?style=flat-square)               | Shared modules of Builder         |
| [@modern-js/builder-doc](https://www.npmjs.com/package/@modern-js/builder-doc)                                   | ![](https://img.shields.io/npm/v/@modern-js/builder-doc?style=flat-square)                  | Documentation snippets of Builder |

You can view the source code of these packages in the [packages/builder](https://github.com/modern-js-dev/modern.js/tree/main/packages/builder/) directory of the modern.js repository.

## Next Step

You may want:

<NextSteps>
  <Step href="/guide/quick-start.html" title="Quick Start" description="Learn how to use Builder"/>
  <Step href="/guide/features.html" title="All Features" description="Learn all features of Builder"/>
  <Step href="/api" title="API Reference" description="View detailed API documentation"/>
</NextSteps>
