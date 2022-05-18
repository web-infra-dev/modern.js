---
sidebar_label: webpackChain
---

# tools.webpackChain

:::info 适用的工程方案
MWA。
:::

- 类型： `(chain, { env, name, webpack }) => void`
- 默认值： `undefined`

通过 [webpack-chain](https://github.com/neutrinojs/webpack-chain) 来修改默认的 webpack 配置，值为 `Function` 类型。

- 函数的第一个参数为 `webpack-chain` 对象。
- 函数的第二个参数为一些工具集合，包括 `env`、`name`、`webpack` 等。

相比于 `tools.webpack`，**webpack-chain 不仅支持链式调用，而且能够基于别名来定位到内置的 Rule 或 Plugin，从而实现精准的配置修改。**我们推荐使用 `tools.webpackChain` 来代替 `tools.webpack`。

## 示例

以下是一些常见用法的示例，完整 API 请参考 [webpack-chain 文档](https://github.com/neutrinojs/webpack-chain)。

### 新增 loader

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpackChain: chain => {
      chain.module
        .rule('compile-svg')
        .test(/\.svg$/)
        .use('svg-inline')
        .loader('svg-inline-loader');
    },
  },
});
```

### 新增 plugin

```js title="modern.config.js"
import CleanPlugin from 'clean-webpack-plugin';

export default defineConfig({
  tools: {
    webpackChain: chain => {
      chain.plugin('clean').use(CleanPlugin, [['dist'], { root: '/dir' }]);
    },
  },
});
```

### 获取环境

通过 `env` 参数可以判断当前环境为 `development` 还是 `production`：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpackChain: (chain, { env }) => {
      console.log(env); // => development
    },
  },
});
```

### webpack

通过 `webpack` 参数可以获取 Modern.js 内部使用的 webpack 对象。

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpackChain: (chain, { webpack }) => {
      console.log(
        new webpack.BannerPlugin({
          banner: 'hello world!',
        }),
      );
    },
  },
});
```

建议优先使用该参数来访问 webpack 对象，而不是通过 import 来引入 `webpack`。

如果需要通过 import 引入，则项目里需要单独安装 webpack 依赖，这样可能会导致 webpack 被重复安装，因此不推荐该做法。

```js title="modern.config.js"
import webpack from 'webpack';

export default defineConfig({
  tools: {
    webpackChain: (chain) => {
      console.log(
        new webpack.BannerPlugin({
          banner: 'hello world!',
        }),
      );
    },
  },
});
```
