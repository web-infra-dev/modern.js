- **类型：** `Object | Function`
- **默认值：**

```js
const defaultOptions = {
  // Loader 配置
  loaderOptions: {},
  // Plugin 配置
  pluginOptions: {
    // cssPath 默认为 static/css, cssFilename 默认为 [name].[contenthash:8].css
    filename: `${cssPath}/${cssFilename}`,
    chunkFilename: `${cssPath}/async/${cssFilename}`,
    ignoreOrder: true,
  },
};
```

通过 `tools.cssExtract` 可以更改 [CssExtractRspackPlugin](https://www.rspack.dev/zh/plugins/rspack/css-extract-rspack-plugin) 或 [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) 的配置。

详细用法可参考 [Rsbuild - tools.cssExtract](https://rsbuild.dev/zh/config/tools/css-extract)。
