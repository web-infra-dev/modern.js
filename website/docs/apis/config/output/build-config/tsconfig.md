---
sidebar_label: tsconfig
---

# buildConfig.tsconfig

:::info 适用的工程方案
* 模块
:::

* 类型： `string`
* 默认值： `'tsconfig.json'`

设置tsconfig文件名

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      tsconfig: 'tsconfig.build.json',
    },
  },
});
```
