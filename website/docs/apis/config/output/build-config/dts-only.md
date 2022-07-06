---
sidebar_label: dtsOnly
---

# buildConfig.dtsOnly

:::info 适用的工程方案
* 模块
:::

* 类型： `boolean`
* 默认值： `false`

设置是否只生成 `d.ts` 文件。该配置仅在 TypeScript 项目里配置了 [`buildConfig.enableDts`](/docs/apis/config/output/build-config/enable-dts) 为 `true` 的情况下才生效。

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      dtsOnly: true,
      enableDts: true,
    },
  },
});
```
