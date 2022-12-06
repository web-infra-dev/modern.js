---
title: tools.swc
sidebar_label: swc
---

- 类型： `Object`
- 默认值： `undefined`

## 介绍

[SWC](https://swc.rs/) (Speedy Web Compiler) 是基于 `Rust` 语言编写的高性能 JavaScript 和 TypeScript 转译和压缩工具。在 Polyfill 和语法降级方面可以和 Babel 提供一致的能力，并且比 Babel 性能高出 10 倍不止。

Modern.js 提供了开箱即用的 SWC 插件，可以为你的 Web 应用提供语法降级、Polyfill 以及压缩，并且移植了一些额外常见的 Babel 插件。

## 安装

使用前需要安装 `@modern-js/plugin-swc` 插件，安装完成后，会自动启用 SWC 编译和压缩能力。

```bash
pnpm add @modern-js/plugin-swc -D
```

## 配置项

你可以通过 `tools.swc` 配置项来设置 SWC 编译行为。

```js title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  tools: {
    swc: {
      jsMinify: {
        compress: {},
        mangle: true,
      },
    },
  },
});
```

完整配置项请参考 [Modern.js Builder - SWC 插件配置](https://modernjs.dev/builder/zh/plugins/plugin-swc.html#%E9%85%8D%E7%BD%AE)。
