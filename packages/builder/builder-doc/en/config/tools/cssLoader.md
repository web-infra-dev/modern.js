- Type: `Object | Function`
- Default: `undefined`

The config of [css-loader](https://github.com/webpack-contrib/css-loader) can be modified through `tools.cssLoader`. The default config is as follows:

```js
{
  importLoaders: 1,
  modules: {
    auto: true,
    exportLocalsConvention: 'camelCase',
    // isProd indicates that the production build
    // In production，we use shorter classname to reduce bundle size
    localIdentName: isProd
      ? '[hash:base64:5]'
      : '[path][name]__[local]--[hash:base64:5]',
    // isServer indicates node (SSR) build
    // isWebWorker indicates web worker build
    exportOnlyLocals: isServer || isWebWorker,
  },
  // The default value of enableSourceMap in production build is true
  sourceMap: enableSourceMap,
}
```

### Object Type

When this value is of type Object, it is merged with the default config via Object.assign. For example:

```js
export default {
  tools: {
    cssLoader: {
      modules: {
        localIdentName: '[path][name]__[local]--[hash:base64:5]',
      },
    },
  },
};
```

### Function Type

When the value is of type Function, the default config is passed in as the first parameter. You can modify the config object directly, or return an object as the final config. For example:

```js
export default {
  tools: {
    cssLoader: config => {
      config.modules.localIdentName = '[path][name]__[local]--[hash:base64:5]';
      return config;
    },
  },
};
```
