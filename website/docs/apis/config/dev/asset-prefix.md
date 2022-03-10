---
sidebar_label: assetPrefix
sidebar_position: 3
---

# `dev.assetPrefix`

:::info 适用的工程方案
* MWA
:::

* 类型： `boolean | string`
* 默认值： `undefined`

开发环境设置静态资源访问前缀。


:::note 注
区别于 [output.assetPrefix](/docs/apis/config/output/asset-prefix)（针对 production 模式），该选项只用于 development 模式。
:::


值类型为 `boolean` 时，`true` 会自动添加 `//ip:port/` 作为访问前缀：


```js title="modern.config.js"
export default defineConfig({
  dev: {
    assetPrefix: true
  }
})
```
对应 JS chunk 在浏览器中加载的地址如下：

```js
<script defer={true} src="//${ip}:8080/static/js/runtime-main.js"></script>;
```

值类型为 `string` 时，会作为前缀，自动拼接到静态资源访问路径上：

```js
export default defineConfig({
  dev: {
    assetPrefix: 'http://example.com/assets',
  },
};
```

对应 JS chunk 在浏览器中加载的地址如下：

```js
<script
  defer={true}
  src="http://example.com/assets/static/js/runtime-main.js"></script>;
```
