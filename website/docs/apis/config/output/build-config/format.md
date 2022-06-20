---
sidebar_label: format
---

# buildConfig.format

:::info 适用的工程方案
* 模块
:::

* 类型： `'cjs' | 'esm' | 'umd'`
* 默认值： `'esm'`

设置模块中javascript产物的输出格式

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      format: 'cjs',
    },
  },
});
```
