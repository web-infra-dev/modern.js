---
sidebar_label: enableInlineScripts
---

# output.enableInlineScripts

:::info 适用的工程方案
* MWA
:::

:::caution 注意
谨慎使用该功能， 内联所有 js 文件可能会使 html 文件尺寸超出预期
:::


* 类型： `boolean`
* 默认值： `false`


生产环境下，内联 js 到 html 文件中：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    enableInlineScripts: true,
  },
});
```

生产环境对应 html 中 script 标签如下:

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/output-enable-inline-scripts.png)


