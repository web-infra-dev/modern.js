---
sidebar_label: esbuild
---

# `tools.esbuild`

:::info 适用的工程方案
* MWA
:::

:::caution 注意
需要安装 `@modern-js/plugin-esbuild`
:::

* 类型： `Object`
* 默认值： `{}`

对应 [esbuild-webpack-plugin](https://github.com/sorrycc/esbuild-webpack-plugin) 的配置, 如下更改 `target` 为 `es6`：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    esbuild: {
      target: 'es6'
    }
  }
});
```
