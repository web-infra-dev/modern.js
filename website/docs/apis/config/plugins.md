---
title: plugins (框架插件)
sidebar_position: 9
---

# `plugins` (框架插件)

:::info 适用的工程方案
* MWA
* 模块
:::

* 类型： `Object`
* 默认值：`[]`


添加定制插件，如何定制插件可以看 [框架插件](/docs/guides/features/custom/framework-plugin/implement)。

:::info 补充信息
数组中 plugin 类型如下：
```ts
type PluginItem = {
  server?: string,
  cli?: string
}
```
:::

#### 配置示例

* npm package

```ts title="modern.config.ts"
export default defineConfig({
  plugins: [
    {
      server: '@modern-js/plugin-custom-server',
      cli: '@modern-js/plugin-custom-cli',
    },
  ],
});
```

* 本地文件

```ts title="modern.config.ts"
export default defineConfig({
  plugins: [
    {
      server: require.resolve('./plugin-custom-server'),
      cli: require.resolve('./plugin-custom-cli'),
    },
  ],
});
```
