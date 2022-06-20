---
sidebar_label: assetsPath
---

# output.assetsPath

:::info 适用的工程方案
* 模块
:::

* 类型： `string`
* 默认值： `styles`

:::warning 警告
将在下一个版本被废弃,使用[output.buildConfig.bundlelessOptions.static.path](/docs/apis/config/output/build-config/bundleless-options#path-1)代替
:::

指定资源产物目录路径。

例如，可将资源产物输出目录改成 `assets-styles` 目录：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    assetsPath: 'assets-styles',
  },
});
```
