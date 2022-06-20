---
sidebar_label: dtsOnly
---

# buildConfig.dtsOnly

:::info 适用的工程方案
* 模块
:::

* 类型： `boolean`
* 默认值： `false`

设置是否只生成d.ts文件

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      dtsOnly: true,
    },
  },
});
```
