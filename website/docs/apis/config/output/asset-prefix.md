---
sidebar_label: assetPrefix
sidebar_position: 1
---

# output.assetPrefix

:::info 适用的工程方案
MWA。
:::

- 类型： `string`
- 默认值： `/`

生产环境使用 CDN 部署时，可利用该选项设置静态资源的 URL 前缀。

在开发环境下，请使用 [dev.assetPrefix](/docs/apis/config/dev/asset-prefix) 配置项进行设置。

设置后，项目的 js、css、图片等静态资源的 URL 都会加上 `output.assetPrefix` 作为前缀：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    assetPrefix: 'https://cdn.example.com/assets/',
  },
});
```

`build` 之后，可以看到 HTML 中的 JS 文件从以下地址加载：

```html
<script
  defer
  src="https://cdn.example.com/assets/static/js/main.ebc4ff4f.js"
></script>
```
