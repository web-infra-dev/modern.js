---
sidebar_label: autoprefixer
---

# tools.autoprefixer

:::info 适用的工程方案
* MWA
:::

* 类型： `Object | Function`
* 默认值： `{ flexbox: 'no-2009' }`

对应 [autoprefixer](https://github.com/postcss/autoprefixer) 的配置。
值为 `Object` 类型时，与默认配置通过 `Object.assign` 合并：

```js title="modern.config.js"
export default defineConfig({
 tools: {
    autoprefixer: {}
  }
})
```

值为 `Function` 类型时，默认配置作为参数传入，可以直接修改配置对象，也可以返回一个对象作为最终配置。

例如，修改 `flexbox` 配置为 `true`：


```js title="modern.config.js"
export default defineConfig({
  tools: {
    autoprefixer: opts => {
      // 内部默认值为 'no-2009', 参考: https://github.com/postcss/autoprefixer#options
      opts.flexbox = true;
    },
  },
});
```
