---
sidebar_label: enableInlineStyles
---
# output.enableInlineStyles

:::info 适用的工程方案
* MWA
:::

:::caution 注意
谨慎使用该功能，内联所有 css 文件可能会使 html 文件尺寸超出预期。
:::

* 类型： `boolean`
* 默认值： `false`

生产环境下，将 css 文件内联到 html 中。

例如，在 `modern.config.js` 中配置如下时：


```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    enableInlineStyles: true,
  },
});
```
执行 `build` 之后可以看到， html 文件内会有对应的 style 内联样式：


![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/output-enable-inline-styles.png)

