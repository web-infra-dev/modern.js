- Type: `Object` | `Function` | `undefined`
- Default: `undefined`

`tools.webpack` is used to configure [webpack](https://webpack.js.org/)。

> [tools.webpackChain](#tools-webpackchain) is also used to modify the webpack configuration, and the function is more powerful. It is recommended to use `tools.webpackChain` first.

### Type

#### Object

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

#### Function

You can also configure it as a function, which accepts one parameter, the original webpack configuration, you can modify this configuration, and then return a new configuration. For example:

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

The second parameter of this function is an object that contains some information about the tool collection. Details are as follows:

### 工具集合

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

- Type: `'web' | 'node' | 'modern-web'`

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

#### webpack

- Type: `Object`

The `webpack` parameter is the original webpack configuration. For example:

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
