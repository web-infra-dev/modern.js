---
sidebar_label: ssrByEntries
sidebar_position: 2
---

# server.ssrByEntries

:::info 适用的工程方案
* MWA
:::

* 类型： `Object`
* 默认值： `undefined`

按入口设置 ssr 选项，选项内的属性同 [ssr](./ssr.md)，指定值会和 ssr 属性内容做替换合并操作，例如：

:::info 注
「 入口名 」默认为目录名，少数情况下通过 `source.entries` 自定义入口时，入口名为 `source.entries` 对象的 `key`。
:::

```js title="modern.config.js"
export default defineConfig({
  server: {
    ssr: true,
    ssrByEntries: {
      // entry1 不启用 ssr
      'page-a': false,
    }
  }
});
```

如上配置，项目整体启用了 ssr, 但是针对入口 `page-a` 关闭了 ssr 渲染能力。

