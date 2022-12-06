- Type: `Object` | `Function` | `undefined`
- Default: `undefined`

`tools.webpack` is used to configure [webpack](https://webpack.js.org/)。

> [tools.webpackChain](#tools-webpackchain) is also used to modify the webpack configuration, and the function is more powerful. It is recommended to use `tools.webpackChain` first.

### Object Type

You can configure it as an object, which will be merged with the original webpack configuration through `webpack-merge`. For example:

```js
export default {
  tools: {
    webpack: {
      resolve: {
        alias: {
          '@util': 'src/util',
        },
      },
    },
  },
};
```

### Function Type

You can also configure it as a function, which accepts one parameter, the original webpack configuration, you can modify this configuration, and then return a new configuration. For example:

```js
export default {
  tools: {
    webpack: config => {
      config.resolve.alias['@util'] = 'src/util';
      return config;
    },
  },
};
```

The second parameter of this function is an object that contains some information about the tool collection. Details are as follows:

### Utils

#### env

- Type: `'development' | 'production' | 'test'`

The `env` parameter can be used to determine whether the current environment is development, production or test. For example:

```js
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

#### isProd

- Type: `boolean`

The `isProd` parameter can be used to determine whether the current environment is production. For example:

```js
export default {
  tools: {
    webpack: (config, { isProd }) => {
      if (isProd) {
        config.devtool = 'source-map';
      }
      return config;
    },
  },
};
```

#### target

- Type: `'web' | 'node' | 'modern-web' | 'web-worker'`

The `target` parameter can be used to determine the current target. For example:

```js
export default {
  tools: {
    webpack: (config, { target }) => {
      if (target === 'node') {
        // ...
      }
      return config;
    },
  },
};
```

#### isServer

- Type: `boolean`

Determines whether the target environment is `node`, equivalent to `target === 'node'`.

```js
export default {
  tools: {
    webpack: (config, { isServer }) => {
      if (isServer) {
        // ...
      }
      return config;
    },
  },
};
```

#### isWebWorker

- Type: `boolean`

Determines whether the target environment is `web-worker`, equivalent to `target === 'web-worker'`.

```js
export default {
  tools: {
    webpack: (config, { isWebWorker }) => {
      if (isWebWorker) {
        // ...
      }
      return config;
    },
  },
};
```

#### webpack

- Type: `typeof import('webpack')`

The webpack instance. For example:

```js
export default {
  tools: {
    webpack: (config, { webpack }) => {
      config.plugins.push(new webpack.ProgressPlugin());
      return config;
    },
  },
};
```

### HtmlWebpackPlugin

- Type: `typeof import('html-webpack-plugin')`

The HtmlWebpackPlugin instance:

```js
export default {
  tools: {
    webpackChain: (chain, { HtmlWebpackPlugin }) => {
      console.log(HtmlWebpackPlugin);
    },
  },
};
```

### addRules

- Type: `(rules: RuleSetRule | RuleSetRule[]) => void`

Add additional [webpack rules](https://webpack.js.org/configuration/module/#modulerules).

For example:

```ts
export default {
  tools: {
    webpack: (config, { addRules }) => {
      // add a single rule
      addRules({
        test: /\.foo/,
        loader: require.resolve('foo-loader'),
      });

      // Add multiple rules as an array
      addRules([
        {
          test: /\.foo/,
          loader: require.resolve('foo-loader'),
        },
        {
          test: /\.bar/,
          loader: require.resolve('bar-loader'),
        },
      ]);
    },
  },
};
```

### prependPlugins

- Type: `(plugins: WebpackPluginInstance | WebpackPluginInstance[]) => void`

Add additional plugins to the head of the internal webpack plugins array, and the plugin will be executed first.

```ts
export default {
  tools: {
    webpack: (config, { prependPlugins, webpack }) => {
      // add a single plugin
      prependPlugins(
        new webpack.BannerPlugin({
          banner: 'hello world!',
        }),
      );

      // Add multiple plugins
      prependPlugins([new PluginA(), new PluginB()]);
    },
  },
};
```

### appendPlugins

- Type: `(plugins: WebpackPluginInstance | WebpackPluginInstance[]) => void`

Add additional plugins at the end of the internal webpack plugins array, the plugin will be executed last.

```ts
export default {
  tools: {
    webpack: (config, { appendPlugins, webpack }) => {
      // add a single plugin
      appendPlugins([
        new webpack.BannerPlugin({
          banner: 'hello world!',
        }),
      ]);

      // Add multiple plugins
      appendPlugins([new PluginA(), new PluginB()]);
    },
  },
};
```

### removePlugin

- Type: `(name: string) => void`

Remove the internal webpack plugin, the parameter is the `constructor.name` of the plugin.

For example, remove the internal [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin):

```ts
export default {
  tools: {
    webpack: (config, { removePlugin }) => {
      removePlugin('ForkTsCheckerWebpackPlugin');
    },
  },
};
```
