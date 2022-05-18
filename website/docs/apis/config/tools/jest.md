---
sidebar_label: jest
---

# tools.jest

:::info 适用的工程方案
* MWA
* 模块
:::

:::caution 注意
需要先通过 `pnpm run new` 启用 单元测试 功能。
:::

* 类型： `Object | Function`
* 默认值：`{}`

对应 [Jest](https://jestjs.io/docs/configuration) 的配置，当为 `Object` 类型时，可以配置 Jest 所支持的所有底层配置 。

```js title=modern.config.js
export default defineConfig({
  tools: {
    jest: {
      testTimeout: 10000
    }
  }
});
```

值为 `Function` 类型时，默认配置作为第一个参数传入，需要返回新的 Jest 配置对象。

```js title=modern.config.js
export default defineConfig({
  tools: {
    jest: options => {
      return {
        ...options,
        testTimeout: 10000
      }
    }
  }
});
```
