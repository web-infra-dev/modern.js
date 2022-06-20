---
sidebar_label: outputPath
---

# buildConfig.outputPath

:::info 适用的工程方案
* 模块
:::

* 类型： `string`
* 默认值： `'./'`

设置模块的构建产物的相对路径（相对于`output.path`）

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      outputPath: './cjs',
      format: 'cjs',
    },
  },
});
```
