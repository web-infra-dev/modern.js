---
sidebar_label: ssr
sidebar_position: 1
---

# server.ssr

:::info 适用的工程方案
* MWA
:::

* 类型： `boolean`
* 默认值： `false`

SSR 开关以及相关设置。

当值类型为 `boolean` 时，表示是否开启 SSR 部署模式，默认 `false` 不开启。

```js title="modern.config.js"
export default defineConfig({
  server: {
    ssr: true,
  }
});
```

