---
sidebar_position: 9
---

# 提升编译速度

Modern.js 默认内置了一系列的编译性能优化策略，但是随着业务场景变复杂、仓库的代码量增大，在使用过程中可能会遇到一些编译性能的问题。

本文档提供了一些可选的提速策略，**开发者可以根据实际场景选取其中的部分策略**，从而进一步提升编译速度。

## 通用优化策略

以下是一些通用的优化策略，对 `modern dev` 和 `modern build` 均有提速效果，其中部分策略对包体积也有优化。

### 减少重复依赖

在实际项目中，会存在某些第三方依赖被安装了多个版本的现象。重复依赖会导致包体积变大、编译速度变慢。

我们可以通过社区中的一些工具来自动消除重复依赖，比如 [yarn-deduplicate](https://github.com/scinos/yarn-deduplicate)。

```bash
npx yarn-deduplicate && yarn
```

如果你在使用 `pnpm`，可以考虑通过**重新生成 lock 文件**来减少重复依赖，

```bash
rm -rf ./node_modules pnpm-lock.yaml && pnpm install
```

:::info
删除 lock 文件会使项目中的依赖版本自动升级到指定范围下的最新版，请进行充分的测试。
:::

### 替换体积较大的依赖

建议将项目中体积较大的第三方依赖替换为更轻量的库，比如将 [moment](https://momentjs.com/) 替换为 [day.js](https://day.js.org/)。

如果不清楚项目中哪些三方依赖的体积较大，可以在执行构建时添加 `--analyze` 参数：

```bash
npx modern build --analyze
```

该参数会生成一个分析构建产物体积的 HTML 文件，手动在浏览器中打开该文件，可以看到打包产物的瓦片图。区块的面积越大，说明该模块的体积越大。

<img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/mwa-build-analyze-8784f762c1ab0cb20935829d5f912c4c.png" />

### 避免使用 ts-loader

默认情况下，Modern.js 使用 Babel 编译 TS 文件，开启 `output.enableTsLoader` 选项后，会使用 `ts-loader` 编译 TS 文件。

由于 `ts-loader` 需要进行额外的语法解析和类型检查，因此会导致项目编译速度变慢，请避免使用。

```js title="modern.config.js"
export default defineConfig({
  output: {
    // 移除这项配置
    enableTsLoader: true,
  },
});
```

详见 [output.enableTsLoader 文档](/docs/apis/config/output/enable-ts-loader)。

### 提升 Browserslist 范围

**减少 Polyfill 的代码量可以提升编译速度。**Modern.js 会根据项目的 Browserslist 配置范围进行代码编译，并注入相应的 Polyfill。如果项目对兼容性的要求较低，可以根据实际情况，提升 Browserslist 范围，从而减少 Polyfill 的代码量。

默认的 Browserslist 配置为：

```js
['> 0.01%', 'not dead', 'not op_mini all'];
```

比如只兼容 Chrome 53 以上的浏览器，可以改成：

```js
['Chrome >= 53'];
```

详见 [客户端兼容性 - Browserslist 配置](/docs/guides/usages/compatibility#browserslist-配置)。

### 按需引入 Polyfill

明确第三方依赖不需要 Polyfill 的情况下，可以将 `output.polyfill` 设置为 `usage`，根据代码中使用到的语法，按需注入所需的 Polyfill 代码，从而减少 Polyfill 的代码量。

```js title="modern.config.js"
export default defineConfig({
  output: {
    polyfill: 'usage',
  },
});
```

详见 [客户端兼容性 - Polyfill 模式](/docs/guides/usages/compatibility#polyfill-模式)。

## dev 优化策略

以下是针对 `modern dev` 进行提速的策略。

### 调整开发环境 SourceMap 格式

为了提供良好的调试体验，Modern.js 在开发环境下默认使用 webpack 提供的 `cheap-module-source-map` 格式 SourceMap。

由于生成高质量的 SourceMap 需要额外的性能开销，通过调整开发环境的 SourceMap 格式，可以提升 dev 编译速度。

比如禁用 SourceMap：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpackChain(chain) {
      chain.devtool(false);
    },
  },
});
```

或是把 SourceMap 格式设置为开销最小的 `eval` 格式：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpackChain(chain) {
      chain.devtool('eval');
    },
  },
});
```

> 关于不同 SourceMap 格式之间的详细差异，请查看 [webpack - devtool](https://webpack.js.org/configuration/devtool/)。

### 调整开发环境的 Browserslist 范围

这项优化的原理与「提升 Browserslist 范围」类似，区别在于，我们可以为开发环境和生产环境设置不同的 browserslist，使开发环境下不需要引入额外的 Polyfill 编译逻辑。

比如在 `package.json` 中添加以下配置，在开发环境下只兼容最新的浏览器，在生产环境下兼容实际需要的浏览器：

```json
{
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

注意，这项优化策略会导致 `dev` 构建的产物与 `build` 构建的产物存在一定差异。

## build 优化策略

以下是针对 `modern build` 进行提速的策略。

### 禁用生产环境 SourceMap

如果项目在生产环境下不需要 SourceMap，可以通过 `disableSourceMap` 配置项关闭，从而提升 build 构建的速度。

```js title="modern.config.js"
export default defineConfig({
  output: {
    disableSourceMap: true,
  },
});
```

详见 [output.disableSourceMap](/docs/apis/config/output/disable-source-map)。

### 使用 esbuild 压缩

Modern.js 基于 esbuild 提供了代码压缩的能力，在大型工程中开启 `@modern-js/plugin-esbuild` 插件，**可以大幅度减少代码压缩所需的时间，同时有效避免 OOM (heap out of memory) 问题**。

使用 esbuild 压缩虽然带来了构建效率上的提升，但 esbuild 的压缩比例是低于 terser 的，因此**构建产物的体积会增大**，请根据业务情况酌情使用（比较适合中后台场景）。

详见 [tools.esbuild](/docs/apis/config/tools/esbuild)。
