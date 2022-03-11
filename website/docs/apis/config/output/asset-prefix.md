---
sidebar_label: assetPrefix
sidebar_position: 1
---

# `output.assetPrefix`

:::info 适用的工程方案
* MWA
:::

* 类型： `string`
* 默认值： `/`


生产环境使用 CDN 部署时，可利用该选项设置访问前缀。

设置后，项目的 js、css、图片等静态资源链接都会加上 `output.assetPrefix` 作为前缀：

```javascript title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    assetPrefix: '//cdn.example.copm/assets/',
  },
});
```

`build` 之后可以看到 html 中 JS chunk 从以下地址加载：

```javascript
<script
  defer="defer"
  src="//cdn.example.copm/assets/static/js/187.ebc4ff4f.js"></script>;
```


