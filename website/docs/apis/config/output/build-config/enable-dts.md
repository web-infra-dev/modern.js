---
sidebar_label: enableDts
---

# buildConfig.enableDts

:::info 适用的工程方案
* 模块
:::

* 类型： `boolean`
* 默认值： `false`

设置是否生成d.ts文件

:::info 提示
此配置和type check（类型检查）所绑定，不生成d.ts文件则不会做类型检查
:::

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      enableDts: true,
    },
  },
});
```
