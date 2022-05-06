---
sidebar_label: disableInlineRuntimeChunk
---

# output.disableInlineRuntimeChunk

:::info 适用的工程方案
* MWA
:::

* 类型： `boolean`
* 默认值： `false`

生产环境下，默认会将 webpack runtime 代码内联到页面中，减少页面 HTTP 请求：

设置该选项为 `true` 后可以关闭这一行为：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    disableInlineRuntimeChunk: true,
  },
});
```
