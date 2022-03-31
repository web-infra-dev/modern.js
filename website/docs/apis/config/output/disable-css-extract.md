---
sidebar_label: disableCssExtract
sidebar_position: 18
---

# `output.disableCssExtract`

:::info 适用的工程方案
* MWA
:::

* 类型： `boolean`
* 默认值： `false`

生产环境下，默认会把 css 提取为独立文件输出到 dist 目录。

设置该选项为 true 后，生产环境不会提取 css 文件，会在运行时动态插入 style 标签加载项目的样式。

具体配置如下:

```javascript title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  outupt: {
    disableCssExtract: true,
  },
});
```
