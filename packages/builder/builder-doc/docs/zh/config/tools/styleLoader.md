- **类型：** `Object | Function`
- **默认值：** `{}`
- **打包工具：** `仅支持 webpack`

通过 `tools.styleLoader` 可以设置 [style-loader](https://github.com/webpack-contrib/style-loader) 的配置项。

值得注意的是，Builder 默认不会开启 `style-loader`，你可以通过 `output.disableCssExtract` 配置项来开启它。

### Object 类型

当此值为 Object 类型时，与默认配置通过 Object.assign 合并。比如：

```js
export default {
  tools: {
    styleLoader: {
      insert: 'head',
    },
  },
};
```

### Function 类型

当此值为 Function 类型时，默认配置作为第一个参数传入，你可以直接修改配置对象，也可以返回一个对象作为最终配置。比如：

```js
export default {
  tools: {
    styleLoader: config => {
      config.insert = 'head';
      return config;
    },
  },
};
```
