# 自定义 webpack 配置

## 推荐方式

我们推荐使用 [`tools.webpackChain`](/zh/api/config-tools.html#tools-webpackchain) 来修改 webpack 配置，值为 `Function` 类型，接收两个参数：

- 第一个参数为 `webpack-chain` 对象实例，你可以通过这个实例来修改默认的 webpack 配置。
- 第二个参数为一个[工具集合](/zh/api/config-tools.html#工具集合-2)，包括`env`、`isProd`、`CHAIN_ID` 等。

当然，你也可以使用 [tools.webpack](/zh/api/config-tools.html#tools-webpack) 来进行配置 相比于 `tools.webpack`，`tools.webpackChain` 不仅支持链式调用，而且能够基于别名来定位到内置的 Rule 或 Plugin，从而实现精准的配置修改。所以我们推荐使用 `tools.webpackChain` 来代替 `tools.webpack`。

## 常用操作示例

### 新增/修改/删除 loader

```js
export default {
  tools: {
    webpackChain: (chain, { CHAIN_ID }) => {
      // 新增 loader
      chain.module
        .rule('md')
        .test(/\.md$/)
        .use('md-loader')
        .loader('md-loader');
      // 修改 loader
      chain.module
        .rule(CHAIN_ID.RULE.JS)
        .use(CHAIN_ID.USE.BABEL)
        .tap(options => {
          options.plugins.push('babel-plugin-xxx');
          return options;
        });
      // 删除 loader
      chain.module.rule(CHAIN_ID.RULE.JS).uses.delete(CHAIN_ID.USE.BABEL);
    },
  },
};
```

### 新增/修改/删除 plugin

```js
export default {
  tools: {
    webpackChain: (chain, { webpack, CHAIN_ID }) => {
      // 新增插件
      chain.plugin('define').use(webpack.DefinePlugin, [
        {
          'process.env': {
            NODE_ENV: JSON.stringify(process.env.NODE_ENV),
          },
        },
      ]);
      // 修改插件
      chain.plugin(CHAIN_ID.PLUGIN.HMR).tap(options => {
        options[0].fullBuildTimeout = 200;
        return options;
      });
      // 删除插件
      chain.plugins.delete(CHAIN_ID.PLUGIN.HMR);
    },
  },
};
```

### 根据不同环境修改配置

在工具集合中你可以拿到各种环境的标识，如开发/生产/测试环境构建、 SSR 构建、Web Worker 构建，从而实现不同环境下的配置修改。

```js
export default {
  tools: {
    webpackChain: (chain, { env, isProd, target, isServer, isWebWorker }) => {
      if (utils.env === 'development' || utils.env === 'test') {
        // ...
      }
      if (utils.isProd) {
        // ...
      }
      if (utils.target === 'node') {
        // ...
      }
      if (utils.isServer) {
        // ...
      }
      if (utils.isWebWorker) {
        // ...
      }
    },
  },
};
```

以上是一些常见的配置示例，完整的 webpack-chain API 请见 [webpack-chain 文档](https://github.com/neutrinojs/webpack-chain)。
