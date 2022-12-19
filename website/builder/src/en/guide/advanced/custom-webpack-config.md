# Custom webpack config

Builder supports directly modifying webpack configuration objects, and also supports deep customization of webpack configuration through webpack-chain.

## Modify the webpack configuration object

You can use [tools.webpack](/zh/api/config-tools.html#tools-webpack) to modify the webpack configuration object.

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

:::tip When to use
When you only need to modify a small amount of webpack configuration, you can use `tools.webpack`. But if you need to modify the built-in webpack plugins or loaders of Builder, please use `tools.webpackChain` to modify.
:::

## Using webpack-chain

webpack-chain is a configuration modification tools that is different from modifying webpack configuration objects. Compared with modifying webpack configuration objects, webpack-chain not only supports chain calls, but also can modify built-in Rule or Plugin based on id.

### tools.webpackChain config

Builder provides [tools.webpackChain](/zh/api/config-tools.html#tools-webpackchain) config to modify webpack-chain.

The value of `tools.webpackChain` is `Function` type, which receives two parameters:

- The first parameter is the `webpack-chain` instance, you can use this instance to modify the default webpack config.
- The second parameter is a [utils collection](/en/api/config-tools.html#utils-2), including `env`, `isProd`, `CHAIN_ID`, etc.

Here's a basic example:

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

## webpack-chain Basics

Before you start using webpack-chain to modify your webpack configuration, it is recommended that you understand some basics.

### How does webpack-chain locate

Simply put, webpack-chain requires users to set a unique id for each Rule, Loader, Plugin, and Minimizer. Through these ids, you can easily find the desired object from deeply nested webpack configuration object.

Builder exports all internally defined ids through the `CHAIN_ID` object, so you can use these exported ids to locate the Loader or Plugin you want to modify, without having to search through complex traversal in the webpack configuration object.

For example, to delete the built-in HTML plugin via `CHAIN_ID.PLUGIN.HTML`:

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

### webpack-chain id type

The `CHAIN_ID` object contains some ids, which have different meanings:

| CHAIN_ID field            | Corresponding configuration | Description                                                  |
| ------------------------- | --------------------------- | ------------------------------------------------------------ |
| `CHAIN_ID.PLUGIN`         | `plugins[i]`                | corresponds to a plugin in the webpack configuration         |
| `CHAIN_ID.RULE`           | `module.rules[i]`           | corresponds to a Rule in the webpack configuration           |
| `CHAIN_ID.USE`            | `module.rules[i].loader`    | corresponds to a Loader in the webpack configuration         |
| `CHAIN_ID.MINIMIZER`      | `optimization.minimizer`    | corresponds to a compression tool in webpack configuration   |
| `CHAIN_ID.RESOLVE_PLUGIN` | `resolve.plugins[i]`        | corresponds to a Resolve plugin in the webpack configuration |

## webpack-chain Demo

### Add/Modify/Delete loader

```js
export default {
  tools: {
    webpackChain: (chain, { CHAIN_ID }) => {
      // Add loader
      chain.module
        .rule('md')
        .test(/\.md$/)
        .use('md-loader')
        .loader('md-loader');

      // Modify loader
      chain.module
        .rule(CHAIN_ID.RULE.JS)
        .use(CHAIN_ID.USE.BABEL)
        .tap(options => {
          options.plugins.push('babel-plugin-xxx');
          return options;
        });

      // Delete loader
      chain.module.rule(CHAIN_ID.RULE.JS).uses.delete(CHAIN_ID.USE.BABEL);
    },
  },
};
```

### Add/Modify/Delete plugin

```js
export default {
  tools: {
    webpackChain: (chain, { webpack, CHAIN_ID }) => {
      // Add plugin
      chain.plugin('define').use(webpack.DefinePlugin, [
        {
          'process.env': {
            NODE_ENV: JSON.stringify(process.env.NODE_ENV),
          },
        },
      ]);

      // Modify plugin
      chain.plugin(CHAIN_ID.PLUGIN.HMR).tap(options => {
        options[0].fullBuildTimeout = 200;
        return options;
      });

      // Delete plugin
      chain.plugins.delete(CHAIN_ID.PLUGIN.HMR);
    },
  },
};
```

### Modify the config according to environment

In the tool collection, you can get the flag of various environments, such as development/production/test environment, SSR build, and Web Worker build, so as to modify the config in different environments.

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

The above are some common config examples. For the complete webpack-chain API, please refer to [webpack-chain documentation](https://github.com/neutrinojs/webpack-chain).
