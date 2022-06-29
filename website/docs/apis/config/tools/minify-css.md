---
sidebar_label: minifyCss
---

# tools.minifyCss

:::info 适用的工程方案
MWA
:::

- 类型： `Object | Function`
- 默认值：`{}`

在生产环境构建时，Modern.js 会通过 [css-minimizer-webpack-plugin](https://github.com/webpack-contrib/css-minimizer-webpack-plugin) 对 CSS 代码进行压缩优化。可以通过 `tools.minifyCss` 修改 [css-minimizer-webpack-plugin](https://github.com/webpack-contrib/css-minimizer-webpack-plugin) 的配置。

## 类型

### Object 类型

配置项的值为 `Object` 类型时，会与默认配置通过 `Object.assign` 合并。

例如下面修改 [cssnano](https://cssnano.co/) 的 `preset` 配置：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    minifyCss: {
      minimizerOptions: {
        preset: require.resolve('cssnano-preset-simple'),
      },
    },
  },
});
```

### Function 类型

配置项的值为 `Function` 类型时，内部默认配置作为第一参数传入，可以直接修改配置对象不返回任何东西，也可以返回一个对象作为最终结果。

```js title="modern.config.js"
export default defineConfig({
  tools: {
    minifyCss: options => {
      options.minimizerOptions = {
        preset: require.resolve('cssnano-preset-simple'),
      },
    }
  }
});
```
