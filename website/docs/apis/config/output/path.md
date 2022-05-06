---
sidebar_label: path
---

# output.path

:::info 适用的工程方案
* MWA
* 模块
:::

* 类型： `string`
* 默认值： `dist`


指定构建产物输出目录。

例如，可将构建产物输出目录改成 `build` 目录：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    path: 'build',
  },
});
```
