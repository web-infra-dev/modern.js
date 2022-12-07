- Type: `Object | Function`
- Default: `undefined`

The config of [css-loader](https://github.com/webpack-contrib/css-loader) can be modified through `tools.cssLoader`. The default config is as follows:

```js
{
  importLoaders: 1,
  modules: {
    auto: true,
    exportLocalsConvention: 'camelCase',
    localIdentName: config.output.cssModuleLocalIdentName,
    // isServer indicates node (SSR) build
    // isWebWorker indicates web worker build
    exportOnlyLocals: isServer || isWebWorker,
  },
  // CSS Source Map enabled by default in development environment
  sourceMap: isDev,
}
```

### Object Type

When this value is an Object, it is merged with the default config via deep merge. For example:

```js
export default {
  tools: {
    cssLoader: {
      modules: {
        exportOnlyLocals: true,
      },
    },
  },
};
```

### Function Type

When the value is a Function, the default config is passed in as the first parameter. You can modify the config object directly, or return an object as the final config. For example:

```js
export default {
  tools: {
    cssLoader: config => {
      config.modules.exportOnlyLocals = true;
      return config;
    },
  },
};
```
