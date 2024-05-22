- **类型：** `Object | Function | undefined`
- **默认值：** `undefined`
- **打包工具：** `仅支持 webpack`

`tools.webpack` 选项用于配置原生的 [webpack](https://webpack.js.org/)。

> `tools.bundlerChain` 同样可以修改 webpack 配置，并且功能更加强大，建议优先使用 `tools.bundlerChain`。

### Object 类型

`tools.webpack` 可以配置为一个对象，这个对象将会和内置的 webpack 配置通过 [webpack-merge](https://github.com/survivejs/webpack-merge) 进行深层合并。

比如添加 `resolve.alias` 配置：

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

### Function 类型

`tools.webpack` 也可以配置为一个函数，这个函数的第一个入参为内置的 webpack 配置对象，你可以对这个对象进行修改，然后返回一份新的配置。比如：

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

:::tip
`tools.webpack` 函数返回的对象会直接作为最终使用的 webpack 配置，不会再与内置的 webpack 配置进行合并。
:::

### 工具集合

这个函数的第二个参数是一个对象，包含了一些工具函数和属性，详情如下：

#### env

- **类型：** `'development' | 'production' | 'test'`

通过 env 参数可以判断当前环境为 development、production 还是 test。比如：

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

- **类型：** `boolean`

通过 isProd 参数可以判断当前环境是否为 production。比如：

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

- **类型：** `'web' | 'node' | 'modern-web' | 'web-worker'`

通过 target 参数可以判断当前构建的目标运行时环境。比如：

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

- **类型：** `boolean`

判断当前构建的目标运行时环境是否为 `node`，等价于 `target === 'node'`。

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

- **类型：** `boolean`

判断当前构建的目标运行时环境是否为 `web-worker`，等价于 `target === 'web-worker'`。

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

- **类型：** `typeof import('webpack')`

通过这个参数你可以拿到 webpack 实例。比如：

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

#### HtmlWebpackPlugin

- **类型：** `typeof import('html-webpack-plugin')`

通过这个参数你可以拿到 HtmlWebpackPlugin 实例。

```js
export default {
  tools: {
    webpack: (chain, { HtmlWebpackPlugin }) => {
      console.log(HtmlWebpackPlugin);
    },
  },
};
```

#### addRules

- **类型：** `(rules: RuleSetRule | RuleSetRule[]) => void`

添加额外的 [webpack rules](https://webpack.js.org/configuration/module/#modulerules)。

示例：

```ts
export default {
  tools: {
    webpack: (config, { addRules }) => {
      // 添加单条规则
      addRules({
        test: /\.foo/,
        loader: require.resolve('foo-loader'),
      });

      // 以数组形式添加多条规则
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

- **类型：** `(plugins: WebpackPluginInstance | WebpackPluginInstance[]) => void`

在内部 webpack 插件数组头部添加额外的插件，数组头部的插件会优先执行。

```ts
export default {
  tools: {
    webpack: (config, { prependPlugins, webpack }) => {
      // 添加单个插件
      prependPlugins(
        new webpack.BannerPlugin({
          banner: 'hello world!',
        }),
      );

      // 以数组形式添加多个插件
      prependPlugins([new PluginA(), new PluginB()]);
    },
  },
};
```

#### appendPlugins

- **类型：** `(plugins: WebpackPluginInstance | WebpackPluginInstance[]) => void`

在内部 webpack 插件数组尾部添加额外的插件，数组尾部的插件会在最后执行。

```ts
export default {
  tools: {
    webpack: (config, { appendPlugins, webpack }) => {
      // 添加单个插件
      appendPlugins([
        new webpack.BannerPlugin({
          banner: 'hello world!',
        }),
      ]);

      // 以数组形式添加多个插件
      appendPlugins([new PluginA(), new PluginB()]);
    },
  },
};
```

#### removePlugin

- **类型：** `(name: string) => void`

删除内部的 webpack 插件，参数为该插件的 `constructor.name`。

例如，删除内部的 [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin)：

```ts
export default {
  tools: {
    webpack: (config, { removePlugin }) => {
      removePlugin('ForkTsCheckerWebpackPlugin');
    },
  },
};
```

#### mergeConfig

- **类型：** `(...configs: WebpackConfig[]) => WebpackConfig`

用于合并多份 webpack 配置，等价于 [webpack-merge](https://github.com/survivejs/webpack-merge)。

```ts
export default {
  tools: {
    webpack: (config, { mergeConfig }) => {
      return mergeConfig(config, {
        devtool: 'eval',
      });
    },
  },
};
```
