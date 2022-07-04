---
sidebar_label: outputPath
---

# buildConfig.outputPath

:::info 适用的工程方案
* 模块
:::

* 类型： `string`
* 默认值： `'./'`

设置构建产物的相对路径（相对于 [`output.path`](/docs/apis/config/output/path) ）。

例如将 `cjs` 产物输出到项目的 `./dist/cjs/` 目录下，则配置如下：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      outputPath: './cjs',
      format: 'cjs',
    },
    path: './dist',
  },
});
```
