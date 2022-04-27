---
sidebar_label: disableDefaultEntries
sidebar_position: 7
---

# source.disableDefaultEntries

:::info 适用的工程方案
* MWA
:::

* 类型： `boolean`
* 默认值： `false`

关闭根据项目目录结构自动识别应用构建入口的功能，默认情况下，Modern.js 会根据项目目录结构得到对应构建入口。

:::warning 警告
推荐按照 Modern.js 提供的目录规范组织代码可以更好使用框架的功能，避免一些冗余的配置。
:::

设置如下，即可关闭默认的行为：

```js title="modern.config.js"
export default defineConfig({
  source: {
    disableDefaultEntries: true
  }
});
```
