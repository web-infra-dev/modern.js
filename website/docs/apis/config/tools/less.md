---
sidebar_label: less
sidebar_position: 7
---

# `tools.less`

:::info 适用的工程方案
* MWA
* 模块
:::

:::caution 注意
MWA 项目需要请确保使用【[new](/docs/apis/commands/mwa/new)】 启用 Less 支持。
模块项目需要请确保使用【[new](/docs/apis/commands/module/new)】 启用 Less 支持。
:::

* 类型： `Object | Function`
* 默认值：`{ lessOptions: { javascriptEnabled: true } }`

对应 [less-loader](https://lesscss.org/) 的配置，值为 `Object` 类型时，与默认配置通过 `Object.assign` 合并：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    less: {
      modifyVars: {},
    },
  },
});
```

值为 `Function` 类型时，内部默认配置作为第一参数传入，可以直接修改配置对象不返回任何东西，也可以返回一个对象作为最终结果；第二个参数为修改 `less-loader` 配置的工具函数集合。

如下，修改 less 和 css 变量实现主题定制需求：


```js title="modern.config.js"
export default defineConfig({
  tools: {
    less: opts => ({
      lessOptions: {
        modifyVars: {
          '@base-font-size': 37.5,
          '@primary-color': 'red',
        },
      },
    }),
  },
});
```
