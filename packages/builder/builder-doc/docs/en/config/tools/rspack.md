- **Type:** `Object` | `Function` | `undefined`
- **Default:** `undefined`
- **Bundler:** `only support Rspack`

`tools.rspack` is used to configure [Rspack](https://www.rspack.org/).

### Object Type

You can configure it as an object, which will be merged with the original Rspack configuration through [webpack-merge](https://github.com/survivejs/webpack-merge). For example:

```js
export default {
  tools: {
    rspack: {
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

You can also configure it as a function, which accepts one parameter, the original Rspack configuration, you can modify this configuration, and then return a new configuration. For example:

```js
export default {
  tools: {
    rspack: config => {
      config.resolve.alias['@util'] = 'src/util';
      return config;
    },
  },
};
```

The second parameter of this function is an object that contains some information about the tool collection. Details are as follows:

### Utils

#### env

- **Type:** `'development' | 'production' | 'test'`

The `env` parameter can be used to determine whether the current environment is development, production or test. For example:

```js
export default {
  tools: {
    rspack: (config, { env }) => {
      if (env === 'development') {
        config.devtool = 'cheap-module-eval-source-map';
      }
      return config;
    },
  },
};
```

#### isProd

- **Type:** `boolean`

The `isProd` parameter can be used to determine whether the current environment is production. For example:

```js
export default {
  tools: {
    rspack: (config, { isProd }) => {
      if (isProd) {
        config.devtool = 'source-map';
      }
      return config;
    },
  },
};
```

#### target

- **Type:** `'web' | 'node' | 'modern-web' | 'web-worker'`

The `target` parameter can be used to determine the current target. For example:

```js
export default {
  tools: {
    rspack: (config, { target }) => {
      if (target === 'node') {
        // ...
      }
      return config;
    },
  },
};
```

#### isServer

- **Type:** `boolean`

Determines whether the target environment is `node`, equivalent to `target === 'node'`.

```js
export default {
  tools: {
    rspack: (config, { isServer }) => {
      if (isServer) {
        // ...
      }
      return config;
    },
  },
};
```

#### isWebWorker

- **Type:** `boolean`

Determines whether the target environment is `web-worker`, equivalent to `target === 'web-worker'`.

```js
export default {
  tools: {
    rspack: (config, { isWebWorker }) => {
      if (isWebWorker) {
        // ...
      }
      return config;
    },
  },
};
```

### addRules

- **Type:** `(rules: RuleSetRule | RuleSetRule[]) => void`

Add additional [Rspack rules](https://www.rspack.org/config/module.html#modulerules).

For example:

```ts
export default {
  tools: {
    rspack: (config, { addRules }) => {
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

- **Type:** `(plugins: RspackPluginInstance | RspackPluginInstance[]) => void`

Add additional plugins to the head of the internal Rspack plugins array, and the plugin will be executed first.

```ts
export default {
  tools: {
    rspack: (config, { prependPlugins }) => {
      // add a single plugin
      prependPlugins(
        new PluginA(),
      );

      // Add multiple plugins
      prependPlugins([new PluginA(), new PluginB()]);
    },
  },
};
```

### appendPlugins

- **Type:** `(plugins: RspackPluginInstance | RspackPluginInstance[]) => void`

Add additional plugins at the end of the internal Rspack plugins array, the plugin will be executed last.

```ts
export default {
  tools: {
    rspack: (config, { appendPlugins }) => {
      // add a single plugin
      appendPlugins([
        new PluginA(),
      ]);

      // Add multiple plugins
      appendPlugins([new PluginA(), new PluginB()]);
    },
  },
};
```

### removePlugin

- **Type:** `(name: string) => void`

Remove the internal Rspack plugin, the parameter is the `constructor.name` of the plugin.

For example, remove the internal [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer):

```ts
export default {
  tools: {
    rspack: (config, { removePlugin }) => {
      removePlugin('BundleAnalyzerPlugin');
    },
  },
};
```

### mergeConfig

- **Type:** `(...configs: RspackConfig[]) => RspackConfig`

Used to merge multiple Rspack configs, same as [webpack-merge](https://github.com/survivejs/webpack-merge)。

```ts
export default {
  tools: {
    rspack: (config, { mergeConfig }) => {
      return mergeConfig(config, {
        devtool: 'eval',
      });
    },
  },
};
```
