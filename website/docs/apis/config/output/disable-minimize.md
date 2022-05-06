---
sidebar_label: disableMinimize
---

# output.disableMinimize

:::info 适用的工程方案
* MWA
:::

* 类型： `boolean`
* 默认值： `false`

禁用生产环境下 JS 和 CSS 压缩, 配置如下即可：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    disableMinimize: true,
  },
});
```
