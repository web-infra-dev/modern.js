---
sidebar_label: terser
---

# tools.terser

:::info 适用的工程方案
MWA
:::

- 类型： `Object | Function`
- 默认值：见下方默认配置。

<details>
  <summary>terser 默认配置</summary>

```js
const defaultOptions = {
  terserOptions: {
    compress: {
      ecma: 5,
    },
    mangle: { safari10: true },
    output: {
      ecma: 5,
      ascii_only: true,
    },
  },
};
```

</details>

在生产环境构建时，Modern.js 会通过 [terser-webpack-plugin](https://github.com/webpack-contrib/terser-webpack-plugin) 对 JS 代码进行压缩优化。可以通过 `tools.terser` 修改 [css-minimizer-webpack-plugin](https://github.com/webpack-contrib/css-minimizer-webpack-plugin) 的配置。

## 类型

### Object 类型

配置项的值为 `Object` 类型时，会与默认配置通过 `Object.assign` 合并。

例如生产环境下移除 console：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    terser: {
      terserOptions: {
        compress: {
          drop_console: true,
        },
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
    terser: opts => {
      opts.terserOptions.compress.drop_console = true;
    },
  },
});
```
