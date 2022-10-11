- Type: `Object` | `Function` | `undefined`
- Default: `undefined`

`tools.webpack` 选项用于配置原生的 [webpack](https://webpack.js.org/)。

> [tools.webpackChain](#tools-webpackchain) 同样可以修改 webpack 配置，并且功能更加强大，建议优先使用 `tools.webpackChain`。

### 类型

#### Object

你可以配置为一个对象，这个对象将会和原始的 webpack 配置通过 `webpack-merge` 进行合并。比如：

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

#### Function

你也可以配置为一个函数，这个函数接收一个参数，即原始的 webpack 配置，你可以对这个配置进行修改，然后返回一个新的配置。比如：

```js
export default {
  tools: {
    webpack: (config) => {
      config.resolve.alias['@util'] = 'src/util';
      return config;
    },
  },
};
```

这个函数的第二个参数是一个对象，包含了一些工具集合的信息。详情如下：

### 工具集合

#### env

- Type: `'development' | 'production' | 'test'`

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

- Type: `boolean`

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

- Type: `'web' | 'node' | 'modern-web'`

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

#### webpack

- Type: `Object`

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
