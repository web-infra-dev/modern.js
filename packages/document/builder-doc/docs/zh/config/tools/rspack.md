- **类型：** `Object | Function | undefined`
- **默认值：** `undefined`
- **打包工具：** `仅支持 Rspack`

`tools.rspack` 选项用于配置原生的 [Rspack](https://www.rspack.dev/)。

### Object 类型

`tools.rspack` 可以配置为一个对象，这个对象将会和内置的 Rspack 配置通过 [webpack-merge](https://github.com/survivejs/webpack-merge) 进行深层合并。

比如添加 `resolve.alias` 配置：

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

### Function 类型

`tools.rspack` 也可以配置为一个函数，这个函数接收一个参数，即内置的 Rspack 配置对象，你可以对这个对象进行修改，然后返回一份新的配置。比如：

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
`tools.rspack` 函数返回的对象会直接作为最终使用的 Rspack 配置，不会再与内置的 Rspack 配置进行合并。
:::

### 工具集合

这个函数的第二个参数是一个对象，包含了一些工具函数和属性，详情如下：

#### env

- **类型：** `'development' | 'production' | 'test'`

通过 env 参数可以判断当前环境为 development、production 还是 test。比如：

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

- **类型：** `boolean`

通过 isProd 参数可以判断当前环境是否为 production。比如：

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

- **类型：** `'web' | 'node' | 'modern-web' | 'web-worker'`

通过 target 参数可以判断当前构建的目标运行时环境。比如：

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

- **类型：** `boolean`

判断当前构建的目标运行时环境是否为 `node`，等价于 `target === 'node'`。

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

- **类型：** `boolean`

判断当前构建的目标运行时环境是否为 `web-worker`，等价于 `target === 'web-worker'`。

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

- **类型：** `(rules: RuleSetRule | RuleSetRule[]) => void`

添加额外的 [Rspack rules](https://www.rspack.dev/config/module.html#modulerules)。

示例：

```ts
export default {
  tools: {
    rspack: (config, { addRules }) => {
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

- **类型：** `(plugins: RspackPluginInstance | RspackPluginInstance[]) => void`

在内部 Rspack 插件数组头部添加额外的插件，数组头部的插件会优先执行。

```ts
export default {
  tools: {
    rspack: (config, { prependPlugins }) => {
      // 添加单个插件
      prependPlugins(new PluginA());

      // 以数组形式添加多个插件
      prependPlugins([new PluginA(), new PluginB()]);
    },
  },
};
```

#### appendPlugins

- **类型：** `(plugins: RspackPluginInstance | RspackPluginInstance[]) => void`

在内部 Rspack 插件数组尾部添加额外的插件，数组尾部的插件会在最后执行。

```ts
export default {
  tools: {
    rspack: (config, { appendPlugins }) => {
      // 添加单个插件
      appendPlugins([new PluginA()]);

      // 以数组形式添加多个插件
      appendPlugins([new PluginA(), new PluginB()]);
    },
  },
};
```

#### removePlugin

- **类型：** `(name: string) => void`

删除内部的 Rspack 插件，参数为该插件的 `constructor.name`。

例如，删除内部的 [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)：

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

- **类型：** `(...configs: RspackConfig[]) => RspackConfig`

用于合并多份 Rspack 配置，等价于 [webpack-merge](https://github.com/survivejs/webpack-merge)。

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

- **类型：** `(name: string) => string`

获取 builder 内置依赖的所在路径，例如：

- sass
- sass-loader
- less
- less-loader
- babel-loader
- url-loader
- file-loader
- ...

该方法通常在需要与 builder 复用同一份依赖时会被用到。

:::tip
Builder 内部依赖会随着版本迭代而发生变化，例如产生大版本变更。在非必要的情况下，请避免使用此 API。
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
