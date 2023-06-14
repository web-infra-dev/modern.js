- **Type:** `Object | Function`
- **Default:** `undefined`

The config of [css-loader](https://github.com/webpack-contrib/css-loader) can be modified through `tools.cssLoader`. The default config is as follows:

```js
{
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
  // importLoaders is `1` when compiling css files, and is `2` when compiling sass/less files
  importLoaders: 1 || 2,
}
```

:::tip
When using Rspack as the bundler, this configuration is only supported when set [disableCssExtract](https://modernjs.dev/builder/api/config-output.html#outputdisablecssextract) is true.
:::

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
