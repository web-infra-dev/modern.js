- Type: `false | Object | Function`
- Default

```js
{
  // Loader 配置
  loaderOptions: {},
  // Plugin 配置
  pluginOptions: {
    // cssPath 默认为 static/css, cssFilename 默认为 [name].[contenthash:8].css
    filename: `${cssPath}/${cssFilename}`,
    chunkFilename: `${cssPath}/async/${cssFilename}`,
    ignoreOrder: true,
  }
}
```

通过 `tools.cssExtract` 可以更改 [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) 的配置。

### Object 类型

当此值为 Object 类型时，与默认配置通过 Object.assign 合并。比如：

```js
export default {
  tools: {
    cssExtract: {
      pluginOptions: {
        filename: 'static/css/[name].[contenthash:8].css',
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
    cssExtract: config => {
      config.pluginOptions.filename = 'static/css/[name].[contenthash:8].css';
      return config;
    },
  },
};
```

更多配置细节可参考 [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin)。

### Boolean 类型

将 `tools.cssExtract` 配置为 `false`，可以禁用默认的 `mini-css-extract-plugin` 插件。

```js
export default {
  tools: {
    cssExtract: false,
  },
}
```
