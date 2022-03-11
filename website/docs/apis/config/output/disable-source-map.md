---
sidebar_label: disableSourceMap
sidebar_position: 13
---
# `output.disableSourceMap`

:::info 适用的工程方案
* MWA
* 模块
:::

* 类型： `boolean`
* 默认值： `false`

关闭生产环境生成 JS、CSS sourceMap 的功能：

```javascript title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    disableSourceMap: true,
  },
});
```
