---
sidebar_label: minifyCss
---

# `tools.minifyCss`

:::info 适用的工程方案
* MWA
:::

* 类型： `Object | Function`
* 默认值：见下方配置详情。

<details>
  <summary>minifyCss 配置详情</summary>

```js
  {
    cssProcessorOptions: {
      parser: safePostCssParser,
        map: { // 设置 output.disableSourceMap 后，为 false
          inline: false,
          annotation: true,
        }
    },
  }
```

:::tip 提示
更多关于：<a href="https://github.com/NMFR/optimize-css-assets-webpack-plugin" target="_blank">MinifyCss 配置</a>。
:::
</details>

对应 [optimize-css-assets-webpack-plugin](https://github.com/NMFR/optimize-css-assets-webpack-plugin) 的配置， 值为 `Object` 类型时，与默认配置合并(deep merge)：


```js title="modern.config.js"
export default defineConfig({
  tools: {
    minifyCss: {},
  },
});
```

值为 `Function` 类型时，默认配置作为第一个参数传入，可以直接修改配置对象不做返回，也可以返回一个对象作为最终结果。例如下面修改 [cssnano](https://cssnano.co/) 的配置：


```js title="modern.config.js"
export default defineConfig({
  tools: {
    minifyCss: options => {
      options.cssProcessorPluginOptions = {
        preset: ['default', { reduceTransforms: false }],
      },
    }
  }
});
```
