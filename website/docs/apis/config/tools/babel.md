---
sidebar_label: babel
sidebar_position: 1
---
# `tools.babel`
:::info 适用的工程方案
* MWA
* 模块
:::

* 类型： `Object | Function`
* 默认值：见下方配置详情。

<details>
  <summary>babel 配置详情</summary>


```js
{
  presets: ['@modern-js/babel-preset-app'],
  plugins: []
}
```

:::tip 提示
更多关于：<a href="https://github.com/babel/babel-loader" target="_blank">Babel 配置</a>。
:::

</details>

对应 [babel-loader](https://github.com/babel/babel-loader) 的配置。

值为 `Object` 类型时，与默认配置通过 `Object.assign` 合并。

```js title="modern.config.js"
export default defineConfig({
  tools: {
    babel: {},
  },
};
```

值为 `Function` 类型时，默认配置作为第一个参数传入，可以直接修改配置对象，也可以返回一个值作为最终结果，第二个参数对象提供了一些可以直接调用的工具函数：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    babel: config => {
      config.plugins.push([
        'babel-plugin-import',
        {
          libraryName: 'xxx-components',
          libraryDirectory: 'es',
          style: true,
        },
      ]);
    },
  },
});
```

<!-- TODO: babel-chain -->
