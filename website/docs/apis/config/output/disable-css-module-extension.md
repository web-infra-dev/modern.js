---
sidebar_label: disableCssModuleExtension
sidebar_position: 25
---

# `output.disableCssModuleExtension`

:::info 适用的工程方案
* MWA
:::

* 类型： `boolean`
* 默认值： `false`

默认情况下只有 `*.module.(css|scss|sass|less)` 结尾的文件才被视作 CSS Modules 模块。

开启该功能之后，会将 `*.(css|scss|sass|less)` 样式文件也当做 CSS Modules 模块，具体配置如下:

```javascript title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    disableCssModuleExtension: true,
  },
});
```
