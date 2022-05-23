---
sidebar_label: disableSourceMap
---
# output.disableSourceMap

:::info 适用的工程方案
* MWA
* 模块
:::

* 类型： `boolean`
* 默认值： `false`

如果项目在生产环境下不需要 SourceMap，可以关闭生产环境生成 JS、CSS SourceMap 的功能，从而提升 build 构建的速度。

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    disableSourceMap: true,
  },
});
```
