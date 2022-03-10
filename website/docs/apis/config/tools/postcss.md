---
sidebar_label: postcss
sidebar_position: 3
---

# `tools.postcss`

:::info 适用的工程方案
* MWA
* 模块
:::

* 类型： `Object | Function`
* 默认值：见下方配置详情。

<details>
  <summary>postcss 配置详情</summary>

```js
  {
    ident: 'postcss',
    plugins: () => [
      require('postcss-flexbugs-fixes'),
      require('postcss-custom-properties'),
      require('postcss-initial'),
      require('postcss-page-break'),
      require('postcss-font-variant'),
      require('postcss-media-minmax'),
      require('postcss-nesting'),
      require('autoprefixer')({
        flexbox: 'no-2009'
      })
    ],
    sourceMap: isEnvProduction && shouldUseSourceMap, // 取决于生产环境，以及是否设置 output.disableSourceMap
  }
```

:::tip 提示
更多关于：<a href="https://github.com/postcss/postcss-loader" target="_blank">PostCss 配置</a>。
:::
</details>

对应 [postcss-loader](https://github.com/postcss/postcss-loader) 的配置。
值为 `Object` 类型时，与默认配置通过 `Object.assign` 合并。

```js title="modern.config.js"
export default defineConfig({
  tools: {
    postcss: {},
  },
});
```


值为 `Function` 类型时，内部默认配置作为第一参数传入，可以直接修改配置对象不做返回，也可以返回一个对象作为最终结果；第二个参数为修改 `postcss-loader` 配置的工具函数集合。

例如，在上面默认配置里面看到, `preset-env` 设置是 `stage3`，如果想在 css 中使用 [nesting-rules](https://preset-env.cssdb.org/features#nesting-rules) 特性，需要修改 `preset-env` 到 `stage1`：


```js title="modern.config.js"
export default defineConfig({
  tools: {
    postcss: opts => {
      opts.postcssOptions.stage = 1;
    },
  },
});
```
