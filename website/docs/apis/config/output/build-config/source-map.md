---
sidebar_label: sourceMap
---

# buildConfig.sourceMap

:::info 适用的工程方案
* 模块
:::

* 类型： `boolean | 'inline' | 'external'`
* 默认值：
  + 当 [`buildType`](/docs/apis/config/output/build-config/build-type) 为 `bundle`的时候，默认值为 `true`。
  + 当 [`buildType`](/docs/apis/config/output/build-config/build-type) 为 `bundleless` 的时候，默认值为 `false`。

> 值为 `true` 等价于值为 `'external'`。


设置生成 Sourcemap 的形式。

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      buildType: 'bundle',
      sourceMap: false,
    },
  },
});
```

