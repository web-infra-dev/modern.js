---
title: tools.esbuild
sidebar_label: esbuild
---

- 类型： `Object`
- 默认值： `undefined`

## 介绍

:::tip esbuild 介绍
[esbuild](https://esbuild.github.io/) 是一款基于 Golang 开发的前端构建工具，具有打包、编译和压缩 JavaScript 代码的功能，相比传统的打包编译工具，esbuild 在性能上有显著提升。在代码压缩方面，相比 webpack 内置的 terser 压缩器，esbuild 在性能上有数十倍的提升。
:::

Modern.js 提供了 esbuild 插件，让你能使用 esbuild 代替 babel-loader、ts-loader 和 terser 等库进行代码编译和压缩。在大型工程中开启后，**可以大幅度减少代码编译和压缩所需的时间，同时有效避免 OOM (heap out of memory) 问题**。

## 配置项

你可以通过 `tools.esbuild` 配置项来设置 esbuild 编译行为。

```js title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  tools: {
    esbuild: {
      loader: {
        target: 'chrome61',
      },
      minimize: {
        target: 'chrome61',
      },
    },
  },
});
```

完整配置项请参考 [Modern.js Builder - esbuild 插件配置](https://modernjs.dev/builder/plugins/plugin-esbuild.html#%E9%85%8D%E7%BD%AE)。
