- **Type:** `Object | Function`
- **Default:**

```js
const defaultOptions = {
  // The loader options
  loaderOptions: {},
  // The plugin options
  pluginOptions: {
    // The default value of cssPath is `static/css`
    // while the default value of cssFilename is `[name].[contenthash:8].css`
    filename: `${cssPath}/${cssFilename}`,
    chunkFilename: `${cssPath}/async/${cssFilename}`,
    ignoreOrder: true,
  },
};
```

The config of [CssExtractRspackPlugin](https://www.rspack.dev/plugins/rspack/css-extract-rspack-plugin) / [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) can be modified through `tools.cssExtract`.

For detailed usage, please refer to [Rsbuild - tools.cssExtract](https://rsbuild.dev/config/tools/css-extract).
