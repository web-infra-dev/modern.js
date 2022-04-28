---
sidebar_label: fetcher
sidebar_position: 2
---

# bff.fetcher

:::info 适用的工程方案
* MWA
:::

* 类型：`string`
* 默认值：
  * 浏览器端：[global.fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
  * Node.js 端：[node-fetch](https://github.com/node-fetch/node-fetch)

:::caution 注意
MWA 项目需要请确保使用【[new](/docs/apis/commands/mwa/new)】 启用了 BFF 功能。
:::


自定义 `fetch` 函数，可以用于 Native、小程序场景下的 `fetch` 函数定制。

```ts title="modern.config.ts"
export default defineConfig({
  bff: {
    fetcher: 'custom-fetch'
  }
});
```

:::info 注
这里定制就需要定制两种场景下的 `fetch` 函数，即自行判断运行环境，实现同构的 fetch 函数。
:::
