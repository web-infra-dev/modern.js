---
sidebar_label: disableCssExtract
---

# output.disableCssExtract

:::info 适用的工程方案
* MWA
:::

* 类型： `boolean`
* 默认值： `false`

Modern.js 默认会把 CSS 提取为独立文件，并输出到 `dist` 目录。

设置该选项为 `true` 后，CSS 文件会经过 `style-loader` 处理，内联到 JS 文件中，并在运行时动态插入 style 标签，从而完成样式加载。

具体配置如下:

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    disableCssExtract: true,
  },
});
```
