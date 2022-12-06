# 提升构建性能

Modern.js Builder 默认对构建性能进行了充分优化，但是随着业务场景变复杂、项目代码量变大，你可能会遇到一些构建性能的问题。

本文档提供了一些可选的提速策略，**开发者可以根据实际场景选取其中的部分策略**，从而进一步提升构建速度。

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

### 使用 esbuild 编译

[esbuild](https://esbuild.github.io/) 是一款基于 Golang 开发的前端构建工具，具有打包、编译和压缩 JavaScript 代码的功能，相比传统的打包编译工具，esbuild 在性能上有显著提升。

Builder 提供了 esbuild 插件，让你能使用 esbuild 代替 babel-loader、ts-loader 和 terser 等库进行代码编译和压缩。详见 [esbuild 插件](/plugins/plugin-esbuild.html)。

### 减少重复依赖

在业务项目中，会存在某些第三方依赖被安装了多个版本的现象。重复依赖会导致包体积变大、构建速度变慢。

我们可以通过社区中的一些工具来检测或消除重复依赖。

如果你在使用 `pnpm`，可以使用 [pnpm-deduplicate](https://github.com/ocavue/pnpm-deduplicate) 来分析出所有的重复依赖，并通过升级依赖或声明 [pnpm overrides](https://pnpm.io/package_json#pnpmoverrides) 进行版本合并。

```bash
npx pnpm-deduplicate --list
```

如果你在使用 `yarn`，可以使用 [yarn-deduplicate](https://github.com/scinos/yarn-deduplicate) 来自动合并重复依赖：

```bash
npx yarn-deduplicate && yarn
```

### 使用更轻量的库

建议将项目中体积较大的三方库替换为更轻量的库，比如将 [moment](https://momentjs.com/) 替换为 [day.js](https://day.js.org/)。

如果你需要找出项目中体积较大的三方库，可以在执行构建时添加 [BUNDLE_ANALYZE=true](/zh/api/config-performance.html#performance-bundleanalyze) 环境变量：

```bash
BUNDLE_ANALYZE=true pnpm build
```

添加该参数后，Builder 会生成一个分析构建产物体积的 HTML 文件，手动在浏览器中打开该文件，可以看到打包产物的瓦片图。区块的面积越大，说明该模块的体积越大。

<img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/mwa-build-analyze-8784f762c1ab0cb20935829d5f912c4c.png" />

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

### 提升 Browserslist 范围

Builder 会根据项目的 Browserslist 配置范围进行代码编译，并注入相应的 Polyfill。如果项目不需要兼容旧版浏览器，可以根据实际情况来提升 Browserslist 范围，从而减少在语法和 Polyfill 上的编译开销。

Builder 默认的 Browserslist 配置为：

```js
['> 0.01%', 'not dead', 'not op_mini all'];
```

比如只兼容 Chrome 61 以上的浏览器，可以改成：

```js
['Chrome >= 61'];
```

### 按需引入 Polyfill

在明确第三方依赖不需要额外 Polyfill 的情况下，你可以将 [output.polyfill](/zh/api/config-output.html#output-polyfill) 设置为 `usage`。

在 `usage` 模式下，Builder 会分析源代码中使用的语法，按需注入所需的 Polyfill 代码，从而减少 Polyfill 的代码量。

```js
export default {
  output: {
    polyfill: 'usage',
  },
};
```

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

这项优化的原理与「提升 Browserslist 范围」类似，区别在于，我们可以为开发环境和生产环境设置不同的 browserslist，从而减少开发环境下的编译开销。

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

### 使用图片压缩

在一般的前端项目中，图片资源的体积往往是项目产物体积的大头，因此如果能尽可能精简图片的体积，那么将会对项目的打包产物体积起到明显的优化效果。你可以在 Builder 中注册插件来启用图片压缩功能:

```js
import { PluginImageCompress } from '@modern-js/builder-plugin-image-compress';

// 往 builder 实例上添加插件
builder.addPlugins([PluginImageCompress()]);
```

详见 [图片压缩插件](/zh/plugins/plugin-image-compress)。

### 代码拆包

良好的拆包策略对于提升应用的加载性能是十分重要的，可以充分利用浏览器的缓存机制，减少请求数量，加快页面加载速度。

在 Builder 中内置了[多种拆包策略](/zh/guide/advanced/split-chunk)，可以满足大部分应用的需求，你也可以根据自己的业务场景，自定义拆包配置，比如下面的配置:

```ts
export default {
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
      forceSplitting: {
        // 比如将 react-query 包拆分为一个 Chunk
        react_query: [/node_modules\/react-query/],
      },
    },
  },
};
```
