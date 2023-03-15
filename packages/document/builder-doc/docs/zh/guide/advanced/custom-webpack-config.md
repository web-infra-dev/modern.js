# 修改 webpack 配置

Builder 支持直接修改 webpack 配置对象，也支持通过 webpack-chain 来深度定制 webpack 配置。

## 修改 webpack 配置对象

你可以使用 [tools.webpack](/api/config-tools.html#toolswebpack) 来修改 webpack 配置对象。

```ts
export default {
  tools: {
    webpack: (config, { env }) => {
      if (env === 'development') {
        config.devtool = 'cheap-module-eval-source-map';
      }
      return config;
    },
  },
};
```

:::tip 何时使用
当你只需要修改少量 webpack 配置时，可以使用 `tools.webpack`。但如果你需要修改 Builder 内置的 webpack plugins 或 loaders，请使用 `tools.webpackChain` 进行修改。
:::

## 使用 webpack-chain

webpack-chain 是区别于直接修改 webpack 配置的另一种配置修改方式，相较于直接修改 webpack 配置对象，webpack-chain 不仅支持链式调用，并且能够基于 id 来修改内置的 Rule 或 Plugin.

### tools.webpackChain 配置项

Builder 提供了 [tools.webpackChain](/api/config-tools.html#toolswebpackchain) 配置项来修改 webpack-chain。

`tools.webpackChain` 的值为 `Function` 类型，接收两个参数：

- 第一个参数为 `webpack-chain` 实例对象，你可以通过这个实例来修改默认的 webpack 配置。
- 第二个参数为一个[工具集合](/api/config-tools.html#工具集合-2)，包括 `env`、`isProd`、`CHAIN_ID` 等。

下面是一个基本示例：

```ts
export default {
  tools: {
    webpackChain: (chain, { env }) => {
      if (env === 'development') {
        chain.devtool('cheap-module-eval-source-map');
      }
    },
  },
};
```

## webpack-chain 基础知识

在开始使用 webpack-chain 来修改 webpack 配置之前，建议你先了解一些基础知识。

### webpack-chain 是如何快速定位的

简单来说，webpack-chain 要求使用者为每个 Rule、Loader、Plugin、Minimizer 都设置一个独一无二的 id，通过这个 id，就可以便捷地从嵌套层级很深的对象中找到所需的对象。

Builder 将内部定义的全部 id 都通过 `CHAIN_ID` 对象导出，因此你可以通过这些导出的 id，快速定位到你想要修改的 Loader 或 Plugin，而不需要在 webpack 配置对象里通过复杂的遍历寻找。

比如通过 `CHAIN_ID.PLUGIN.HTML` 来删除内置的 HTML 插件：

```ts
export default {
  tools: {
    webpackChain: (chain, { webpack, CHAIN_ID }) => {
      //
      chain.plugins.delete(CHAIN_ID.PLUGIN.HTML);
    },
  },
};
```

### webpack-chain id 的类型

`CHAIN_ID` 对象包含了多种 id，对应的含义如下：

| CHAIN_ID 字段             | 对应的配置               | 描述                                       |
| ------------------------- | ------------------------ | ------------------------------------------ |
| `CHAIN_ID.PLUGIN`         | `plugins[i]`             | 对应 webpack 配置中的一个插件              |
| `CHAIN_ID.RULE`           | `module.rules[i]`        | 对应 webpack 配置中的一个 Rule             |
| `CHAIN_ID.USE`            | `module.rules[i].loader` | 对应 webpack 配置中的一个 Loader           |
| `CHAIN_ID.MINIMIZER`      | `optimization.minimizer` | 对应 webpack 配置中的一个压缩工具          |
| `CHAIN_ID.RESOLVE_PLUGIN` | `resolve.plugins[i]`     | 对应 webpack 配置中的中的一个 Resolve 插件 |

## webpack-chain 示例

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
      chain.plugin('custom-define').use(webpack.DefinePlugin, [
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
