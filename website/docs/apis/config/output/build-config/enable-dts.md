---
sidebar_label: enableDts
---

# buildConfig.enableDts

:::info 适用的工程方案
* 模块
:::

* 类型： `boolean`
* 默认值： `false`

设置是否生成 `d.ts` 文件。默认不生成。

:::tip 提示
此配置和 *Type Checking（类型检查）*所绑定。当 `enableDts` 的值为 `true` 的时候会同时进行类型检查，反之则关闭类型检查。**无法在不进行类型检查的情况下生成 `d.ts` 文件**。
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
