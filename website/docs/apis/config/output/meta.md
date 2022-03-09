---
sidebar_label: meta
sidebar_position: 4
---

# `output.meta`

:::info 适用的工程方案
* MWA
:::

* 类型: `Object`
* 默认值：见下方配置详情。

<details>
  <summary>meta 配置详情</summary>

```javascript
  {
    charset: { charset: 'utf-8'},
    viewport: 'width=device-width, initial-scale=1.0, shrink-to-fit=no, viewport-fit=cover, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no',
    'http-equiv': { 'http-equiv': 'x-ua-compatible', content: 'ie=edge'},
    renderer: 'webkit',
    layoutmode: 'standard',
    imagemode: 'force',
    'wap-font-scale': 'no',
    'format-detection': 'telephone=no'
  }
```
</details>


添加或修改已有的网页 `meta` 信息，设置的值会和默认值合并。

举例如， 在 `modern.config.js` 设置如下:

```javascript title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    meta: {
      viewport: 'width=device-width',
      description: 'a description of the page',
    },
  },
});
```

最终 `html` 里面 `meta` 信息如下：

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<meta http-equiv="x-ua-compatible" content="ie=edge">
<meta name="renderer" content="webkit">
<meta name="layoutmode" content="standard">
<meta name="imagemode" content="force">
<meta name="wap-font-scale" content="no">
<meta name="format-detection" content="telephone=no">
<meta name="description" content="a description of the page">
```

可以看到， 修改了默认的 `viewport` meta 标签，并且新增了 `description` 的 `meta` 标签。
