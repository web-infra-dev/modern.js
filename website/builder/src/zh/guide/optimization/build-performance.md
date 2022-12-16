# 提升构建性能

Modern.js Builder 默认对构建性能进行了充分优化，但是随着业务场景变复杂、项目代码量变大，你可能会遇到一些构建性能的问题。

本文档提供了一些可选的提速策略，**开发者可以根据实际场景选取其中的部分策略**，从而进一步提升构建速度。

:::tip 📢 注意
在[优化产物体积](/zh/guide/optimization/optimize-bundle.html)一文中介绍的策略也可以用于提升构建性能，这里不再重复介绍。
:::

## 通用优化策略

以下是一些通用的优化策略，对开发环境和生产环境均有提速效果，其中部分策略对包体积也有优化。

### 升级 Node.js 版本

通常来说，将 Node.js 更新到最新的 [LTS 版本](https://github.com/nodejs/release#release-schedule)，有助于提升构建性能。

尤其是对于 Apple M1/M2 芯片的机型，推荐使用 Node 16 或 Node 18 进行构建。

Node 16 默认提供了 Apple Silicon binaries，因此在 M1/M2 机型上性能会比 Node 14 有大幅度提升。根据我们的测试，**从 Node 14 切换到 Node 16 后，编译速度可以提升 100% 以上**。

你可以通过以下步骤来切换到 Node 16：

```bash
# 安装 Node.js v16
nvm install 16

# 切换到 Node 16
nvm use 16

# 将 Node 16 设置为默认版本
nvm default 16

# 查看 Node 版本
node -v
```

### 使用 SWC 或 esbuild 编译

[SWC](https://swc.rs/) (Speedy Web Compiler) 是基于 `Rust` 语言编写的高性能 JavaScript 和 TypeScript 转译和压缩工具。在 Polyfill 和语法降级方面可以和 Babel 提供一致的能力，并且性能比 Babel 高出一个数量级。

[esbuild](https://esbuild.github.io/) 是一款基于 Golang 开发的前端构建工具，具有打包、编译和压缩 JavaScript 代码的功能，相比传统的打包编译工具，esbuild 在性能上有显著提升。

Builder 提供了 SWC 插件和 esbuild 插件，让你能使用 SWC 或 esbuild 代替 babel-loader、ts-loader 和 terser 等库进行代码编译和压缩。详见：

- [SWC 插件文档](/plugins/plugin-swc.html)
- [esbuild 插件文档](/plugins/plugin-esbuild.html)

:::tip SWC vs esbuild
SWC 编译产物的兼容性较好，支持注入 core-js 等 Polyfill，并且功能更加完备，因此推荐优先使用 SWC 插件。
:::

### 避免使用 ts-loader

默认情况下，Builder 使用 Babel 编译 TS 文件，开启 [tools.tsLoader](/zh/api/config-tools.html#tools-tsloader) 选项后，会使用 `ts-loader` 编译 TS 文件。

由于 `ts-loader` 需要进行额外的语法解析和类型检查，因此会导致项目构建速度变慢，请避免使用。

```js
export default {
  tools: {
    // 移除这项配置
    tsLoader: {},
  },
};
```

详见 [tools.tsLoader 文档](/zh/api/config-tools.html#tools-tsloader)。

## 开发环境优化策略

以下是针对开发环境进行提速的策略。

### 开启延迟编译

你可以开启延迟编译（即按需编译）功能，来提升编译启动速度。

```ts
export default {
  experiments: {
    lazyCompilation: {
      imports: true,
      entries: false,
    },
  },
};
```

这是一项实验性功能，在某些场景下可能无法正确工作，请查看 [experiments.lazyCompilation](/zh/api/config-experiments.html#experiments-lazycompilation) 来了解具体用法。

### 调整 Source Map 格式

为了提供良好的调试体验，Builder 在开发环境下默认使用 `cheap-module-source-map` 格式 Source Map，这是一种高质量的 Source Map 格式，会带来一定的性能开销。

你可以通过调整开发环境的 Source Map 格式来提升构建速度。

比如禁用 Source Map：

```js
export default {
  tools: {
    webpackChain(chain, { env }) {
      if (env === 'development') {
        chain.devtool(false);
      }
    },
  },
};
```

或是把开发环境的 Source Map 格式设置为开销最小的 `eval` 格式：

```js
export default {
  tools: {
    webpackChain(chain, { env }) {
      if (env === 'development') {
        chain.devtool('eval');
      }
    },
  },
};
```

> 关于不同 Source Map 格式之间的详细差异，请查看 [webpack - devtool](https://webpack.js.org/configuration/devtool/)。

### 调整 Browserslist 范围

这项优化的原理与[「提升 Browserslist 范围」](/zh/guide/optimization/optimize-bundle.html#adjust-browserslist)类似，区别在于，我们可以为开发环境和生产环境设置不同的 browserslist，从而减少开发环境下的编译开销。

比如，你可以在 `package.json` 中添加以下配置，表示在开发环境下只兼容最新的浏览器，在生产环境下兼容实际需要的浏览器：

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

注意，这项优化策略会导致开发环境与生产环境的构建产物存在一定差异。

## 生产环境优化策略

以下是针对生产环境进行提速的策略。

### 禁用 Source Map

如果项目在生产环境下不需要 Source Map，可以通过 `disableSourceMap` 配置项关闭，从而提升 build 构建的速度。

```js
export default {
  output: {
    disableSourceMap: true,
  },
};
```

详见 [output.disableSourceMap](/zh/api/config-output.html#output-disablesourcemap)。
