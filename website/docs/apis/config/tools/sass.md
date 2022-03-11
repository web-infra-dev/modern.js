---
sidebar_label: sass
sidebar_position: 6
---

# `tools.sass`

:::info 适用的工程方案
* MWA
* 模块
:::

:::caution 注意
MWA 项目需要请确保使用【[new](/docs/apis/commands/mwa/new)】 启用 Sass 支持。
模块项目需要请确保使用【[new](/docs/apis/commands/module/new)】 启用 Sass 支持。
:::

* 类型：  `Object | Function`
* 默认值： `{}`

对应 [sass-loader](https://github.com/webpack-contrib/sass-loader) 的配置，值为 `Object` 类型时，利用 `Object.assign` 函数与默认配置合并。

```js title="modern.config.js"
export default defineConfig({
  tools: {
    sass: {}
  }
});
```


值为 `Function` 类型时，内部默认配置作为第一参数传入，可以直接修改配置对象不做返回，也可以返回一个对象作为最终结果；第二个参数为修改 `sass-loader` 配置的工具函数集合。

如下配置 [additionalData](https://github.com/webpack-contrib/sass-loader#additionaldata):

```js title="modern.config.js"
export default defineConfig({
  tools: {
    sass: opts => {
      opts.additionalData = async (content, loaderContext) => {
        // ...
      };
    },
  },
});
```
