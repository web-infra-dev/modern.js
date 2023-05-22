- **Type:** `Object | Function | undefined`
- **Default:** `undefined`
- **Bundler:** `only support Rspack`

`tools.rspack` is used to configure [Rspack](https://www.rspack.dev/).

### Object Type

`tools.rspack` can be configured as an object to be deep merged with the built-in Rspack configuration through [webpack-merge](https://github.com/survivejs/webpack-merge).

For example, add `resolve.alias` configuration:

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

`tools.rspack` can be configured as a function. The first parameter of this function is the built-in Rspack configuration object, you can modify this object, and then return it. For example:

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

:::tip
The object returned by the `tools.rspack` function is used directly as the final Rspack configuration and is not merged with the built-in Rspack configuration.
:::

The second parameter of this function is an object, which contains some utility functions and properties, as follows:

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

#### addRules

- **Type:** `(rules: RuleSetRule | RuleSetRule[]) => void`

Add additional [Rspack rules](https://www.rspack.dev/config/module.html#modulerules).

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

#### prependPlugins

- **Type:** `(plugins: RspackPluginInstance | RspackPluginInstance[]) => void`

Add additional plugins to the head of the internal Rspack plugins array, and the plugin will be executed first.

```ts
export default {
  tools: {
    rspack: (config, { prependPlugins }) => {
      // add a single plugin
      prependPlugins(new PluginA());

      // Add multiple plugins
      prependPlugins([new PluginA(), new PluginB()]);
    },
  },
};
```

#### appendPlugins

- **Type:** `(plugins: RspackPluginInstance | RspackPluginInstance[]) => void`

Add additional plugins at the end of the internal Rspack plugins array, the plugin will be executed last.

```ts
export default {
  tools: {
    rspack: (config, { appendPlugins }) => {
      // add a single plugin
      appendPlugins([new PluginA()]);

      // Add multiple plugins
      appendPlugins([new PluginA(), new PluginB()]);
    },
  },
};
```

#### removePlugin

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

#### mergeConfig

- **Type:** `(...configs: RspackConfig[]) => RspackConfig`

Used to merge multiple Rspack configs, same as [webpack-merge](https://github.com/survivejs/webpack-merge).

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

#### getCompiledPath

- **Type:** `(name: string) => string`

Get the path to the builder built-in dependencies, such as:

- sass
- sass-loader
- less
- less-loader
- babel-loader
- url-loader
- file-loader
- ...

This method is usually used when you need to reuse the same dependency with the builder.

:::tip
Builder built-in dependencies are subject to change with version iterations, e.g. generate large version break changes. Please avoid using this API if it is not necessary.
:::

```js
export default {
  tools: {
    rspack: (config, { getCompiledPath }) => {
      const loaderPath = getCompiledPath('less-loader');
      // ...
    },
  },
};
```
