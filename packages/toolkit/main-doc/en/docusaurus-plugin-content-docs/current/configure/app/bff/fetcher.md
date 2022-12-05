---
sidebar_label: fetcher
---

# bff.fetcher

* Type: `string`
* Default:
  * Brower：[global.fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
  * Node.js：[node-fetch](https://github.com/node-fetch/node-fetch)

:::caution Caution
First you need to enable the "BFF" function using [new](/docs/apis/app/commands/new) command.
:::

Custom `fetch` function, which can be used for `fetch` function customization in Native and Mini Program scenarios.

```ts title="modern.config.ts"
export default defineConfig({
  bff: {
    fetcher: 'custom-fetch'
  }
});
```

:::info
You need to judge the running environment when you implement the isomorphic fetch function.
:::
