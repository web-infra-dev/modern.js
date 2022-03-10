---
sidebar_label: devServer
sidebar_position: 12
---

# `tools.devServer`

:::info 适用的工程方案
* MWA
:::

* 类型： `Object`
* 默认值： `{}`

对应 [DevServer](https://webpack.docschina.org/configuration/dev-server/#devserverlivereload) 的配置，用于配置开发环境运行的服务器的选项：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    devServer: {
      hot: true,
      https: false,
      liveReload: false
    }
  }
});
```
:::tip 提示
为了方便接入，Modern.js 大部分配置与 Webpack DevServer 保持一致。
:::

