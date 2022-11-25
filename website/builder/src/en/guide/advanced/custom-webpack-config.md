# Custom webpack config

## Recommended way

We recommend using [`tools.webpackChain`](/en/api/config-tools.html#tools-webpackchain) to modify the webpack configuration. The value is of `Function` type, receiving two parameters:

- The first parameter is the `webpack-chain` instance, you can use this instance to modify the default webpack config.
- The second parameter is a [utils collection](/en/api/config-tools.html#utils-2), including `env`, `isProd`, `CHAIN_ID`, etc.

Of course, you can also use [tools.webpack](/en/api/config-tools.html#tools-webpack). Compared with `tools.webpack`, `tools.webpackChain` not only supports chain calls, And it can locate the built-in Rule or Plugin based on the alias, so as to implement precise config modification. So we recommend using `tools.webpackChain` instead of `tools.webpack`.

## Examples of common operations

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
