- Type: `Object | Function | undefined`
- Default: `{}`

在生产环境构建时，Builder 会通过 [css-minimizer-webpack-plugin](https://github.com/webpack-contrib/css-minimizer-webpack-plugin) 对 CSS 代码进行压缩优化。可以通过 `tools.minifyCss` 修改 [css-minimizer-webpack-plugin](https://github.com/webpack-contrib/css-minimizer-webpack-plugin) 的配置。

### Object 类型

<<<<<<< HEAD
当 `tools.minifyCss` 的值为 `Object` 类型时，会与默认配置通过 `Object.assign` 合并。
=======
当 `tools.minifyCss` 配置为 `Object` 类型时，会与默认配置通过 `Object.assign` 合并。
>>>>>>> cea2c4f65 (docs(builder): add terser/minifyCss/pug document (#1821))

例如下面修改 [cssnano](https://cssnano.co/) 的 `preset` 配置：

```js
export default {
  tools: {
    minifyCss: {
      minimizerOptions: {
        preset: require.resolve('cssnano-preset-simple'),
      },
    },
  },
};
```

### Function 类型

当 `tools.minifyCss` 配置为 `Function` 类型时，默认配置作为第一个参数传入，可以直接修改配置对象，也可以返回一个值作为最终结果。

```js
export default {
   tools: {
    minifyCss: options => {
      options.minimizerOptions = {
        preset: require.resolve('cssnano-preset-simple'),
      },
    }
  }
};
```
