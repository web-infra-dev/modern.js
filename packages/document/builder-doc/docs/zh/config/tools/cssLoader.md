- **类型：** `Object | Function`
- **默认值：** `undefined`

通过 `tools.cssLoader` 可以修改 [css-loader](https://github.com/webpack-contrib/css-loader) 的配置项。默认配置如下:

```js
{
  modules: {
    auto: true,
    exportLocalsConvention: 'camelCase',
    localIdentName: config.output.cssModuleLocalIdentName,
    // isServer 表示 node (SSR) 构建
    // isWebWorker 表示 web worker 构建
    exportOnlyLocals: isServer || isWebWorker,
  },
  // 默认在开发环境下启用 CSS 的 Source Map
  sourceMap: isDev,
  // importLoaders 在编译 css 文件时为 `1`，在编译 sass/less 文件时为 `2`
  importLoaders: 1 || 2,
}
```

详细用法可参考 [Rsbuild - tools.cssLoader](https://rsbuild.dev/zh/config/tools/css-loader)。
