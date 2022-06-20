---
sidebar_label: buildType
---

# buildConfig.buildType

:::info 适用的工程方案
* 模块
:::

* 类型： `'bundle'|'bundleless'`
* 默认值： `'bundleless'`

设置模块的构建方式，是否需要对产物进行打包

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      buildType: 'bundle',
    },
  },
});
```
