---
sidebar_label: assetsPath
sidebar_position: 1
---

# `output.assetsPath`

:::info 适用的工程方案
* 模块
:::

* 类型： `string`
* 默认值： `styles`


指定资源产物目录路径。

例如，可将资源产物输出目录改成 `assets-styles` 目录：

```javascript title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    assetsPath: 'assets-styles',
  },
});
```
