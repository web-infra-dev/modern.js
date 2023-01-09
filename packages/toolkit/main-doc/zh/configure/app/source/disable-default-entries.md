---
title: source.disableDefaultEntries
sidebar_label: disableDefaultEntries
---

- 类型： `boolean`
- 默认值： `false`

关闭根据项目目录结构自动识别应用构建入口的功能，默认情况下，Modern.js 会根据项目目录结构得到对应构建入口。

:::info
默认情况下，Modern.js 会根据项目目录结构得到对应入口信息。具体可参考[入口](/docs/guides/concept/entries)。
配置关闭改机制后，需要使用 [`source.entries`](/docs/configure/app/source/entries) 配置自定义入口。
:::

:::warning 警告
推荐按照 Modern.js 提供的目录规范组织代码可以更好使用框架的功能，避免一些冗余的配置。
:::

设置如下，即可关闭默认的行为：

```ts title="modern.config.ts"
export default defineConfig({
  source: {
    disableDefaultEntries: true,
  },
});
```
