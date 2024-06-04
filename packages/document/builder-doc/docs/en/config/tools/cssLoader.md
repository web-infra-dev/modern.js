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

For detailed usage, please refer to [Rsbuild - tools.cssLoader](https://rsbuild.dev/config/tools/css-loader).
