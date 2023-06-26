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

:::tip
在使用 Rspack 作为打包工具时，仅支持在 [disableCssExtract](https://modernjs.dev/builder/api/config-output.html#outputdisablecssextract) 时使用该配置。
:::

### Object 类型

当此值为 Object 类型时，会与默认配置进行深层合并 (deep merge)。比如：

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

### Function 类型

当此值为 Function 类型时，默认配置作为第一个参数传入，你可以直接修改配置对象，也可以返回一个对象作为最终配置。比如：

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
