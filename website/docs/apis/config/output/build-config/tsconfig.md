---
sidebar_label: tsconfig
---

# buildConfig.tsconfig

:::info 适用的工程方案
* 模块
:::

* 类型： `string`
* 默认值： `'tsconfig.json'`

设置 TSConfig 文件的路径和名称。路径相对于项目路径。

例如设置读取的 TSConfig 文件为 `tsconfig.build.json` 文件，则配置如下：

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
